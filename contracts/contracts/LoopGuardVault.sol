// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IHypurrFiPool.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/ISwapRouter.sol";
import "./utils/ReentrancyGuard.sol";

/// @title LoopGuardVault
/// @notice UBTC/USDXL leverage vault on HypurrFi with HF bands + permissionless deleveraging
contract LoopGuardVault is ReentrancyGuard {
    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    event Deposited(
        address indexed user,
        uint256 amountIn,
        uint256 sharesMinted,
        uint256 hfAfter
    );
    event Withdrawn(
        address indexed user,
        uint256 sharesBurned,
        uint256 amountOutUBTC,
        uint256 hfAfter
    );
    event Rebalanced(
        uint256 hfBefore,
        uint256 hfAfter,
        uint256 debtRepaid,
        uint256 collateralWithdrawn
    );
    event DepositsPaused(bool paused);

    // -----------------------------------------------------------------------
    // Immutable configuration
    // -----------------------------------------------------------------------

    address public immutable collateral; // UBTC
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

    /// @notice Principal UBTC supplied by the vault into HypurrFi (ignores interest)
    uint256 public collateralPrincipal;

    /// @notice Principal USDXL debt tracked by the vault (ignores interest accrual, but subtracts real repays)
    uint256 public debtPrincipal;

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    constructor(
        address _collateral, // UBTC
        address _debt, // USDXL
        address _pool, // HypurrFi Pool
        address _router, // DEX router
        uint256 _hfTarget, // e.g. 1.9e18
        uint256 _hfSoftFloor, // e.g. 1.6e18
        uint256 _hfHardFloor // e.g. 1.4e18
    ) {
        require(_collateral != address(0), "collateral=0");
        require(_debt != address(0), "debt=0");
        require(_pool != address(0), "pool=0");
        require(_router != address(0), "router=0");
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

    /// @notice Deposit UBTC, loop to target band, mint vault shares
    function depositAndLoop(uint256 amountIn) external nonReentrant {
        require(!depositsPaused, "Deposits paused");
        require(amountIn > 0, "amountIn = 0");

        uint256 prevCollateralPrincipal = collateralPrincipal;
        uint256 _totalShares = totalShares;

        // 1) Pull UBTC from user
        _safeTransferFrom(collateral, msg.sender, address(this), amountIn);

        // 2) Supply initial UBTC to HypurrFi
        _ensureMaxApproval(collateral, address(pool), amountIn);
        pool.supply(collateral, amountIn, address(this), REFERRAL_CODE);
        collateralPrincipal = prevCollateralPrincipal + amountIn;

        // 3) Compute how much debt we can safely take
        (, , uint256 availableBorrowsBase, , , uint256 hfBefore) = pool
            .getUserAccountData(address(this));

        // Hypurr base currency is USD-like; assume USDXL ~ 1 base unit
        uint256 borrowAmount = (availableBorrowsBase * BORROW_BPS) /
            BPS_DENOMINATOR;
        // If HF is at/below 1 after deposit, do not borrow; allow deposit-only to improve safety
        if (hfBefore <= 1e18) {
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

            // 5) Swap USDXL -> UBTC
            _ensureMaxApproval(debt, address(router), borrowAmount);
            address[] memory path = new address[](2);
            path[0] = debt;
            path[1] = collateral;

            uint256 ubtcFromSwap = router.swapExactTokensForTokens(
                borrowAmount,
                0, // amountOutMin = 0 for now; can be parameterized later
                path,
                address(this)
            );

            // 6) Supply swapped UBTC back as collateral
            if (ubtcFromSwap > 0) {
                _ensureMaxApproval(collateral, address(pool), ubtcFromSwap);
                pool.supply(
                    collateral,
                    ubtcFromSwap,
                    address(this),
                    REFERRAL_CODE
                );
                collateralPrincipal += ubtcFromSwap;
            }
        }

        // 7) Mint shares (collateral-denominated, approximate)
        uint256 sharesToMint;
        if (_totalShares == 0 || prevCollateralPrincipal == 0) {
            // First depositor: 1 share = 1 UBTC
            sharesToMint = amountIn;
        } else {
            // Keep share price ~ collateralPrincipal / totalShares
            sharesToMint = (amountIn * _totalShares) / prevCollateralPrincipal;
        }

        require(sharesToMint > 0, "shares=0");
        totalShares = _totalShares + sharesToMint;
        balanceOf[msg.sender] += sharesToMint;

        // 8) HF post-condition: only enforce soft floor when we borrowed (increased risk)
        (, , , , , uint256 hfAfter) = pool.getUserAccountData(address(this));
        if (borrowAmount > 0) {
            require(
                hfAfter >= hfSoftFloor && hfAfter > 1e18,
                "HF below soft floor"
            );
        }

        emit Deposited(msg.sender, amountIn, sharesToMint, hfAfter);
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

        // 1) Withdraw that portion of UBTC from HypurrFi
        uint256 ubtcBefore = IERC20(collateral).balanceOf(address(this));
        uint256 returned = pool.withdraw(
            collateral,
            collateralToWithdraw,
            address(this)
        );
        // Some pools ignore return value; fall back to balance diff if needed
        uint256 ubtcAfter = IERC20(collateral).balanceOf(address(this));
        uint256 ubtcFromPool = (ubtcAfter > ubtcBefore)
            ? (ubtcAfter - ubtcBefore)
            : returned;

        require(ubtcFromPool >= collateralToWithdraw, "withdraw underflow");
        collateralPrincipal = ctPrincipal - collateralToWithdraw;

        // 2) Compute how much of this slice should be sold to cover pro-rata debt
        uint256 tokensToSell = 0;
        if (totalDebtBase > 0 && totalCollateralBase > 0) {
            // tokensToSell ~= collateralToWithdraw * (debtBase / collateralBase)
            // This is "sell UBTC whose base value equals share of debt base"
            tokensToSell =
                (collateralToWithdraw * totalDebtBase) /
                totalCollateralBase;

            // Safety: capped by what we actually have
            if (tokensToSell > ubtcFromPool) {
                tokensToSell = ubtcFromPool;
            }
        }

        uint256 userAmountOut = ubtcFromPool;

        // 3) Swap part of withdrawn UBTC -> USDXL and repay
        if (tokensToSell > 0) {
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
                uint256 repaid = pool.repay(
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

                userAmountOut = ubtcFromPool - tokensToSell;
            }
        }

        // Burn shares
        balanceOf[msg.sender] = userShares - shares;
        totalShares = _totalShares - shares;

        require(userAmountOut > 0, "userAmountOut=0");

        // Send UBTC back to user
        _safeTransfer(collateral, msg.sender, userAmountOut);

        // Final HF safety: must remain above 1
        (, , , , , uint256 hfAfter) = pool.getUserAccountData(address(this));
        require(hfAfter >= 1e18, "HF < 1 after withdraw");

        emit Withdrawn(msg.sender, shares, userAmountOut, hfAfter);
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

        // 1) Withdraw UBTC from HypurrFi
        uint256 ubtcBefore = IERC20(collateral).balanceOf(address(this));
        uint256 returned = pool.withdraw(
            collateral,
            collateralToWithdraw,
            address(this)
        );
        uint256 ubtcAfter = IERC20(collateral).balanceOf(address(this));
        uint256 ubtcFromPool = (ubtcAfter > ubtcBefore)
            ? (ubtcAfter - ubtcBefore)
            : returned;

        require(
            ubtcFromPool >= collateralToWithdraw,
            "rebalance withdraw underflow"
        );
        collateralPrincipal = ctPrincipal - collateralToWithdraw;

        // 2) Swap *all* withdrawn UBTC to USDXL
        _ensureMaxApproval(collateral, address(router), ubtcFromPool);
        address[] memory path = new address[](2);
        path[0] = collateral;
        path[1] = debt;

        uint256 usdFromSwap = router.swapExactTokensForTokens(
            ubtcFromPool,
            0,
            path,
            address(this)
        );

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

        // 4) HF invariant: must not get worse
        (, , , , , uint256 hfAfter) = pool.getUserAccountData(address(this));
        require(hfAfter >= hfBefore, "HF not improved");

        emit Rebalanced(hfBefore, hfAfter, repaid, collateralToWithdraw);
    }

    // -----------------------------------------------------------------------
    // View helpers for frontend
    // -----------------------------------------------------------------------

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

    /// @notice Pro-rata user position in base units + shares
    function getUserPosition(
        address user
    )
        external
        view
        returns (
            uint256 userCollateralBase,
            uint256 userDebtBase,
            uint256 healthFactor,
            uint256 userShares
        )
    {
        userShares = balanceOf[user];
        if (userShares == 0 || totalShares == 0) {
            (, , , , , healthFactor) = pool.getUserAccountData(address(this));
            return (0, 0, healthFactor, userShares);
        }

        (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            ,
            ,
            ,
            uint256 hf
        ) = pool.getUserAccountData(address(this));

        uint256 fractionBps = (userShares * BPS_DENOMINATOR) / totalShares;

        userCollateralBase =
            (totalCollateralBase * fractionBps) /
            BPS_DENOMINATOR;
        userDebtBase = (totalDebtBase * fractionBps) / BPS_DENOMINATOR;
        healthFactor = hf;
    }

    /// @notice Approximate total UBTC collateral used by this vault (principal only, no interest)
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
