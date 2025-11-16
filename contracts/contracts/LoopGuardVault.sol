// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IHypurrFiPool.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/ISwapRouter.sol";
import "./utils/ReentrancyGuard.sol";

/// @title LoopGuardVault
/// @notice HYPE/USDXL leverage vault on HypurrFi with HF bands + permissionless deleveraging
contract LoopGuardVault is ReentrancyGuard {
    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    event DepositAndLoop(
        address indexed user,
        uint256 depositedCollateral,
        uint256 borrowedDebt,
        uint256 newShares,
        uint256 healthFactorAfter
    );
    event Withdraw(
        address indexed user,
        uint256 burnedShares,
        uint256 withdrawnCollateral,
        uint256 repaidDebt,
        uint256 healthFactorAfter
    );
    event Rebalance(
        address indexed caller,
        uint256 repaidDebt,
        uint256 withdrawnCollateral,
        uint256 healthFactorBefore,
        uint256 healthFactorAfter
    );
    event DepositsPaused(bool paused);

    // -----------------------------------------------------------------------
    // Immutable configuration
    // -----------------------------------------------------------------------

    address public immutable collateral; // HYPE
    address public immutable debt; // USDXL
    IHypurrFiPool public immutable pool;
    ISwapRouter public immutable router;

    uint256 public immutable hfTarget;
    uint256 public immutable hfSoftFloor;
    uint256 public immutable hfHardFloor;

    // Lending params
    uint256 public constant INTEREST_RATE_MODE = 2; // variable
    uint16 public constant REFERRAL_CODE = 0;

    // Risk / leverage params
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant BORROW_BPS = 7_000; // 70% of available borrows
    uint256 public constant SOFT_REBALANCE_BPS = 2_000; // 20% deleverage when HF < soft
    uint256 public constant HARD_REBALANCE_BPS = 4_000; // 40% deleverage when HF < hard

    // -----------------------------------------------------------------------
    // Ownership / controls (simple)
    // -----------------------------------------------------------------------

    address public immutable owner;
    bool public depositsPaused;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // -----------------------------------------------------------------------
    // Shares & position accounting (approximate)
    // -----------------------------------------------------------------------

    uint256 public totalShares;
    mapping(address => uint256) public balanceOf;

    /// @notice Approximate principal tracking (ignores interest / yield). Principal HYPE supplied by the vault into HypurrFi.
    /// @dev These are NOT exact NAV. Frontends should prefer HypurrFi base data
    ///      from getVaultAccountData() when computing real-time PnL / HF / TVL.
    uint256 public collateralPrincipal;

    /// @notice Principal USDXL debt tracked by the vault (ignores interest accrual, but subtracts real repays)
    uint256 public debtPrincipal;

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    constructor(
        address _collateral, // HYPE
        address _debt, // USDXL
        address _pool, // HypurrFi Pool
        address _router, // DEX router (optional; address(0) disables swaps/looping)
        uint256 _hfTarget, // e.g. 1.9e18
        uint256 _hfSoftFloor, // e.g. 1.6e18
        uint256 _hfHardFloor // e.g. 1.4e18
    ) {
        require(_collateral != address(0), "collateral=0");
        require(_debt != address(0), "debt=0");
        require(_pool != address(0), "pool=0");
        // router may be address(0) to disable swaps/looping
        require(_hfHardFloor < _hfSoftFloor, "HF hard >= soft");
        require(_hfSoftFloor < _hfTarget, "HF soft >= target");
        require(_hfHardFloor >= 1e18, "HF hard < 1");
        require(_hfSoftFloor >= 1e18, "HF soft < 1");
        require(_hfTarget >= 1e18, "HF target < 1");

        collateral = _collateral;
        debt = _debt;
        pool = IHypurrFiPool(_pool);
        router = ISwapRouter(_router);
        hfTarget = _hfTarget;
        hfSoftFloor = _hfSoftFloor;
        hfHardFloor = _hfHardFloor;

        owner = msg.sender;
    }

    // -----------------------------------------------------------------------
    // Admin
    // -----------------------------------------------------------------------

    function pauseDeposits() external onlyOwner {
        depositsPaused = true;
        emit DepositsPaused(true);
    }

    function unpauseDeposits() external onlyOwner {
        depositsPaused = false;
        emit DepositsPaused(false);
    }

    // -----------------------------------------------------------------------
    // Public interface
    // -----------------------------------------------------------------------

    /// @notice Deposit HYPE, loop to target band, mint vault shares
    function depositAndLoop(uint256 amountIn) external nonReentrant {
        require(!depositsPaused, "Deposits paused");
        require(amountIn > 0, "amountIn = 0");

        uint256 prevCollateralPrincipal = collateralPrincipal;
        uint256 _totalShares = totalShares;

        // 0) Snapshot HF BEFORE this deposit to enforce hard floor on new deposits
        (
            ,
            ,
            ,
            ,
            ,
            uint256 hfBeforeDeposit
        ) = pool.getUserAccountData(address(this));
        // If the vault has a live position (hfBeforeDeposit != 0) and HF is below the hard floor,
        // block new deposits until deleveraging (rebalance) occurs.
        require(
            hfBeforeDeposit == 0 || hfBeforeDeposit >= hfHardFloor,
            "HF below hard floor"
        );

        // 1) Pull HYPE from user
        _safeTransferFrom(collateral, msg.sender, address(this), amountIn);

        // 2) Supply initial HYPE to HypurrFi
        _ensureMaxApproval(collateral, address(pool), amountIn);
        pool.supply(collateral, amountIn, address(this), REFERRAL_CODE);
        collateralPrincipal = prevCollateralPrincipal + amountIn;

        // 3) Compute how much debt we can safely take AFTER the deposit
        (, , uint256 availableBorrowsBase, , , ) = pool.getUserAccountData(
            address(this)
        );

        // Hypurr base currency is USD-like; assume USDXL ~ 1 base unit
        uint256 borrowAmount = (availableBorrowsBase * BORROW_BPS) /
            BPS_DENOMINATOR;

        // If no router is configured, skip borrowing here to avoid unhedged debt on deposit.
        // Use depositAndBorrowNoSwap for a borrow-only path if needed.
        if (address(router) == address(0)) {
            borrowAmount = 0;
        }

        if (borrowAmount > 0) {
            // 4) Borrow USDXL
            pool.borrow(
                debt,
                borrowAmount,
                INTEREST_RATE_MODE,
                REFERRAL_CODE,
                address(this)
            );
            debtPrincipal += borrowAmount;

            // 5) Swap USDXL -> HYPE if router configured
            if (address(router) != address(0)) {
                _ensureMaxApproval(debt, address(router), borrowAmount);
                address[] memory path = new address[](2);
                path[0] = debt;
                path[1] = collateral;

                uint256 hypeFromSwap = router.swapExactTokensForTokens(
                    borrowAmount,
                    0, // amountOutMin = 0 for now; can be parameterized later
                    path,
                    address(this)
                );

                // 6) Supply swapped HYPE back as collateral
                if (hypeFromSwap > 0) {
                    _ensureMaxApproval(collateral, address(pool), hypeFromSwap);
                    pool.supply(
                        collateral,
                        hypeFromSwap,
                        address(this),
                        REFERRAL_CODE
                    );
                    collateralPrincipal += hypeFromSwap;
                }
            }
        }

        // 7) Mint shares (collateral-denominated, approximate)
        uint256 sharesToMint;
        if (_totalShares == 0 || prevCollateralPrincipal == 0) {
            // First depositor: 1 share = 1 HYPE
            sharesToMint = amountIn;
        } else {
            // Keep share price ~ collateralPrincipal / totalShares
            sharesToMint = (amountIn * _totalShares) / prevCollateralPrincipal;
        }

        require(sharesToMint > 0, "shares=0");
        totalShares = _totalShares + sharesToMint;
        balanceOf[msg.sender] += sharesToMint;

        // 8) HF post-condition: if we borrowed, ensure we remain within safe band
        (, , , , , uint256 hfAfter) = pool.getUserAccountData(address(this));
        if (borrowAmount > 0) {
            require(
                hfAfter >= hfSoftFloor && hfAfter > 1e18,
                "HF below soft floor"
            );
        }

        emit DepositAndLoop(
            msg.sender,
            amountIn,
            borrowAmount,
            sharesToMint,
            hfAfter
        );
    }

    /// @notice Deposit collateral and (optionally) borrow USDXL without swapping.
    /// @dev For mainnet demos without a DEX router. Ensures HF after >= hfSoftFloor and > 1.
    /// @param amountIn collateral amount to deposit
    /// @param borrowBps BPS of availableBorrowsBase to take as USDXL debt (capped internally)
    function depositAndBorrowNoSwap(
        uint256 amountIn,
        uint256 borrowBps
    ) external nonReentrant {
        require(!depositsPaused, "Deposits paused");
        require(amountIn > 0, "amountIn = 0");

        uint256 prevCollateralPrincipal = collateralPrincipal;
        uint256 _totalShares = totalShares;

        // Block new deposits if vault HF < hard floor (when already active)
        (, , , , , uint256 hfBeforeDeposit) = pool.getUserAccountData(
            address(this)
        );
        require(
            hfBeforeDeposit == 0 || hfBeforeDeposit >= hfHardFloor,
            "HF below hard floor"
        );

        // 1) Pull collateral
        _safeTransferFrom(collateral, msg.sender, address(this), amountIn);

        // 2) Supply to HypurrFi
        _ensureMaxApproval(collateral, address(pool), amountIn);
        pool.supply(collateral, amountIn, address(this), REFERRAL_CODE);
        collateralPrincipal = prevCollateralPrincipal + amountIn;

        // 3) Compute borrow amount (capped by BORROW_BPS)
        (, , uint256 availableBorrowsBase, , , ) = pool.getUserAccountData(
            address(this)
        );
        uint256 bps = borrowBps > BORROW_BPS ? BORROW_BPS : borrowBps;
        uint256 borrowAmount = (availableBorrowsBase * bps) / BPS_DENOMINATOR;

        if (borrowAmount > 0) {
            // 4) Borrow USDXL to the vault; do NOT swap
            pool.borrow(
                debt,
                borrowAmount,
                INTEREST_RATE_MODE,
                REFERRAL_CODE,
                address(this)
            );
            debtPrincipal += borrowAmount;
        }

        // 5) Mint shares (same as depositAndLoop)
        uint256 sharesToMint;
        if (_totalShares == 0 || prevCollateralPrincipal == 0) {
            sharesToMint = amountIn;
        } else {
            sharesToMint = (amountIn * _totalShares) / prevCollateralPrincipal;
        }
        require(sharesToMint > 0, "shares=0");
        totalShares = _totalShares + sharesToMint;
        balanceOf[msg.sender] += sharesToMint;

        // 6) Post HF safety: if we borrowed, HF must remain >= soft floor and > 1
        (, , , , , uint256 hfAfter) = pool.getUserAccountData(address(this));
        if (borrowAmount > 0) {
            require(hfAfter >= hfSoftFloor && hfAfter > 1e18, "HF below soft");
        }

        // Reuse event
        emit DepositAndLoop(
            msg.sender,
            amountIn,
            borrowAmount,
            sharesToMint,
            hfAfter
        );
    }

    /// @notice Withdraw by burning shares; unwinds proportional part of position (approx)
    function withdraw(uint256 shares) external nonReentrant {
        require(shares > 0, "shares=0");

        uint256 _totalShares = totalShares;
        uint256 userShares = balanceOf[msg.sender];
        require(userShares >= shares, "insufficient shares");
        require(_totalShares > 0, "no shares");

        (uint256 totalCollateralBase, uint256 totalDebtBase, , , , ) = pool
            .getUserAccountData(address(this));

        uint256 fractionBps = (shares * BPS_DENOMINATOR) / _totalShares;

        uint256 ctPrincipal = collateralPrincipal;
        uint256 collateralToWithdraw = (ctPrincipal * fractionBps) /
            BPS_DENOMINATOR;
        require(collateralToWithdraw > 0, "too few shares");

        // 1) Withdraw that portion of HYPE from HypurrFi
        uint256 hypeBefore = IERC20(collateral).balanceOf(address(this));
        uint256 returned = pool.withdraw(
            collateral,
            collateralToWithdraw,
            address(this)
        );
        // Some pools ignore return value; fall back to balance diff if needed
        uint256 hypeAfter = IERC20(collateral).balanceOf(address(this));
        uint256 hypeFromPool = (hypeAfter > hypeBefore)
            ? (hypeAfter - hypeBefore)
            : returned;

        require(hypeFromPool >= collateralToWithdraw, "withdraw underflow");
        collateralPrincipal = ctPrincipal - collateralToWithdraw;

        // 2) Compute how much of this slice should be sold to cover pro-rata debt
        uint256 tokensToSell = 0;
        if (totalDebtBase > 0 && totalCollateralBase > 0) {
            // tokensToSell ~= collateralToWithdraw * (debtBase / collateralBase)
            // This is "sell HYPE whose base value equals share of debt base"
            tokensToSell =
                (collateralToWithdraw * totalDebtBase) /
                totalCollateralBase;

            // Safety: capped by what we actually have
            if (tokensToSell > hypeFromPool) {
                tokensToSell = hypeFromPool;
            }
        }

        uint256 userAmountOut = hypeFromPool;
        uint256 repaid = 0;

        // 3) If the vault already holds USDXL (e.g., from borrow-only flows), repay up to
        // the user's proportional share of debt before attempting any swap.
        if (debtPrincipal > 0) {
            uint256 proportionalDebtToken = (debtPrincipal * fractionBps) /
                BPS_DENOMINATOR;
            uint256 usdBal = IERC20(debt).balanceOf(address(this));
            uint256 repayNow = usdBal < proportionalDebtToken
                ? usdBal
                : proportionalDebtToken;
            if (repayNow > 0) {
                _ensureMaxApproval(debt, address(pool), repayNow);
                uint256 repaidNow = pool.repay(
                    debt,
                    repayNow,
                    INTEREST_RATE_MODE,
                    address(this)
                );
                if (repaidNow > 0) {
                    if (repaidNow >= debtPrincipal) {
                        debtPrincipal = 0;
                    } else {
                        debtPrincipal -= repaidNow;
                    }
                    // Reduce the amount of HYPE we need to sell by equivalent share approximation:
                    // keep tokensToSell as-is since it's a base approximation; repaying now only helps HF.
                }
            }
        }

        // 4) Swap part of withdrawn HYPE -> USDXL and repay
        if (tokensToSell > 0 && address(router) != address(0)) {
            _ensureMaxApproval(collateral, address(router), tokensToSell);
            address[] memory path = new address[](2);
            path[0] = collateral;
            path[1] = debt;

            uint256 usdFromSwap = router.swapExactTokensForTokens(
                tokensToSell,
                0,
                path,
                address(this)
            );

            if (usdFromSwap > 0) {
                _ensureMaxApproval(debt, address(pool), usdFromSwap);
                repaid = pool.repay(
                    debt,
                    usdFromSwap,
                    INTEREST_RATE_MODE,
                    address(this)
                );

                // Adjust approximate debt principal with real repaid amount
                if (repaid >= debtPrincipal) {
                    debtPrincipal = 0;
                } else {
                    debtPrincipal -= repaid;
                }

                userAmountOut = hypeFromPool - tokensToSell;
            }
        }

        // Burn shares
        balanceOf[msg.sender] = userShares - shares;
        totalShares = _totalShares - shares;

        require(userAmountOut > 0, "userAmountOut=0");

        // Send HYPE back to user
        _safeTransfer(collateral, msg.sender, userAmountOut);

        // Final HF safety: must remain above 1
        (, , , , , uint256 hfAfter) = pool.getUserAccountData(address(this));
        require(hfAfter >= 1e18, "HF < 1 after withdraw");

        emit Withdraw(msg.sender, shares, userAmountOut, repaid, hfAfter);
    }

    /// @notice Permissionless deleverage when HF is below configured bands
    /// Only ever reduces risk; reverts if HF_after < HF_before
    function rebalance() external nonReentrant {
        (, uint256 totalDebtBase, , , , uint256 hfBefore) = pool
            .getUserAccountData(address(this));

        require(totalDebtBase > 0, "no debt");

        // Nothing to do if we're safely above soft floor
        if (hfBefore >= hfSoftFloor) {
            return;
        }

        require(hfBefore > 1e18, "HF already < 1");

        // If the vault holds any USDXL already (e.g., from borrow-only flows), repay it now.
        uint256 repaidPre = 0;
        uint256 usdPreBal = IERC20(debt).balanceOf(address(this));
        if (usdPreBal > 0) {
            _ensureMaxApproval(debt, address(pool), usdPreBal);
            repaidPre = pool.repay(
                debt,
                usdPreBal,
                INTEREST_RATE_MODE,
                address(this)
            );
            if (repaidPre > 0) {
                if (repaidPre >= debtPrincipal) {
                    debtPrincipal = 0;
                } else {
                    debtPrincipal -= repaidPre;
                }
            }
        }

        // Without a router, selling collateral would not repay debt and could worsen HF.
        if (address(router) == address(0)) {
            (, , , , , uint256 hfAfterOnlyRepay) = pool.getUserAccountData(
                address(this)
            );
            require(hfAfterOnlyRepay >= hfBefore, "HF not improved");
            require(hfAfterOnlyRepay >= hfHardFloor, "HF below hard floor");
            emit Rebalance(msg.sender, repaidPre, 0, hfBefore, hfAfterOnlyRepay);
            return;
        }

        uint256 deleverageBps = hfBefore < hfHardFloor
            ? HARD_REBALANCE_BPS
            : SOFT_REBALANCE_BPS;

        // Compute max withdraw bps that keeps HF >= 1 if we *only* withdrew collateral
        // HF = (Cb * LT) / Db; we don't need LT to bound delta:
        // Require (Cb - x) >= Cb / HF  =>  x <= Cb * (1 - 1/HF)
        // So maxWithdrawBps ~= (HF - 1) / HF
        uint256 maxWithdrawBps = ((hfBefore - 1e18) * BPS_DENOMINATOR) /
            hfBefore;

        if (deleverageBps > maxWithdrawBps) {
            deleverageBps = maxWithdrawBps;
        }
        if (deleverageBps == 0) {
            // Nothing safe to do; make it a no-op
            return;
        }

        uint256 ctPrincipal = collateralPrincipal;
        uint256 collateralToWithdraw = (ctPrincipal * deleverageBps) /
            BPS_DENOMINATOR;
        require(collateralToWithdraw > 0, "collateralToWithdraw=0");

        // 1) Withdraw HYPE from HypurrFi
        uint256 hypeBefore = IERC20(collateral).balanceOf(address(this));
        uint256 returned = pool.withdraw(
            collateral,
            collateralToWithdraw,
            address(this)
        );
        uint256 hypeAfter = IERC20(collateral).balanceOf(address(this));
        uint256 hypeFromPool = (hypeAfter > hypeBefore)
            ? (hypeAfter - hypeBefore)
            : returned;

        require(
            hypeFromPool >= collateralToWithdraw,
            "rebalance withdraw underflow"
        );
        collateralPrincipal = ctPrincipal - collateralToWithdraw;

        // 2) Swap *all* withdrawn HYPE to USDXL (deleverage-only)
        uint256 usdFromSwap = 0;
        if (address(router) != address(0)) {
            _ensureMaxApproval(collateral, address(router), hypeFromPool);
            address[] memory path = new address[](2);
            path[0] = collateral;
            path[1] = debt;

            usdFromSwap = router.swapExactTokensForTokens(
                hypeFromPool,
                0,
                path,
                address(this)
            );
        }

        // 3) Repay as much USDXL debt as possible
        uint256 repaid = 0;
        if (usdFromSwap > 0) {
            _ensureMaxApproval(debt, address(pool), usdFromSwap);
            repaid = pool.repay(
                debt,
                usdFromSwap,
                INTEREST_RATE_MODE,
                address(this)
            );

            if (repaid >= debtPrincipal) {
                debtPrincipal = 0;
            } else {
                debtPrincipal -= repaid;
            }
        }

        // 4) HF invariants: must not get worse and must not go below hard floor
        (, , , , , uint256 hfAfter) = pool.getUserAccountData(address(this));
        require(hfAfter >= hfBefore, "HF not improved");
        require(hfAfter >= hfHardFloor, "HF below hard floor");

        emit Rebalance(
            msg.sender,
            repaid + repaidPre,
            collateralToWithdraw,
            hfBefore,
            hfAfter
        );
    }

    // -----------------------------------------------------------------------
    // View helpers for frontend
    // -----------------------------------------------------------------------

    /// @notice Aggregated vault status for frontend.
    /// @return totalShares_ total vault shares
    /// @return totalCollateralBase total collateral base reported by HypurrFi
    /// @return totalDebtBase total debt base reported by HypurrFi
    /// @return availableBorrowsBase available borrows base reported by HypurrFi
    /// @return healthFactor current health factor reported by HypurrFi
    function getVaultStatus()
        external
        view
        returns (
            uint256 totalShares_,
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 healthFactor
        )
    {
        totalShares_ = totalShares;
        (
            totalCollateralBase,
            totalDebtBase,
            availableBorrowsBase,
            ,
            ,
            healthFactor
        ) = pool.getUserAccountData(address(this));
    }

    /// @notice Pro-rata user position in base units + shares with a simple HF estimate passthrough
    function getUserPosition(
        address user
    )
        external
        view
        returns (
            uint256 userShares,
            uint256 userShareOfCollateralBase,
            uint256 userShareOfDebtBase,
            uint256 userHealthFactorEstimate
        )
    {
        uint256 _userShares = balanceOf[user];
        if (_userShares == 0 || totalShares == 0) {
            (, , , , , userHealthFactorEstimate) = pool.getUserAccountData(
                address(this)
            );
            return (_userShares, 0, 0, userHealthFactorEstimate);
        }

        (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            ,
            ,
            ,
            uint256 hf
        ) = pool.getUserAccountData(address(this));

        uint256 fractionBps = (_userShares * BPS_DENOMINATOR) / totalShares;

        userShareOfCollateralBase =
            (totalCollateralBase * fractionBps) /
            BPS_DENOMINATOR;
        userShareOfDebtBase =
            (totalDebtBase * fractionBps) /
            BPS_DENOMINATOR;
        userShares = _userShares;
        userHealthFactorEstimate = hf;
    }

    /// @notice Current health factor of the vault on HypurrFi
    function getHealthFactor() external view returns (uint256) {
        (, , , , , uint256 hf) = pool.getUserAccountData(address(this));
        return hf;
    }

    /// @notice Full account data passthrough from HypurrFi for this vault
    function getVaultAccountData()
        external
        view
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        )
    {
        return pool.getUserAccountData(address(this));
    }

    /// @notice Simple config tuple for frontend consumption
    function getConfig()
        external
        view
        returns (
            address collateralToken,
            address debtToken,
            address hypurrPool,
            address swapRouter,
            uint256 hfTarget_,
            uint256 hfSoftFloor_,
            uint256 hfHardFloor_
        )
    {
        return (
            collateral,
            debt,
            address(pool),
            address(router),
            hfTarget,
            hfSoftFloor,
            hfHardFloor
        );
    }

    /// @notice Approximate total HYPE collateral used by this vault (principal only, no interest)
    function totalCollateralToken() external view returns (uint256) {
        return collateralPrincipal;
    }

    /// @notice Approximate total USDXL debt of this vault (principal approximation)
    function totalDebtToken() external view returns (uint256) {
        return debtPrincipal;
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    function _ensureMaxApproval(
        address token,
        address spender,
        uint256 amount
    ) internal {
        if (amount == 0) return;
        uint256 current = IERC20(token).allowance(address(this), spender);
        if (current < amount) {
            // Set to max; avoids repeated approve calls
            require(
                IERC20(token).approve(spender, type(uint256).max),
                "approve failed"
            );
        }
    }

    function _safeTransfer(address token, address to, uint256 amount) internal {
        require(IERC20(token).transfer(to, amount), "transfer failed");
    }

    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) internal {
        require(
            IERC20(token).transferFrom(from, to, amount),
            "transferFrom failed"
        );
    }
}
