// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LoopGuardVault.sol";
import "./mocks/MockERC20.sol";
import "./mocks/MockHypurrFiPool.sol";
import "./mocks/MockSwapRouter.sol";

contract LoopGuardVaultTest {
    LoopGuardVault vault;
    MockERC20 ubtc;
    MockERC20 usdxl;
    MockHypurrFiPool pool;
    MockSwapRouter router;

    function _setUp() internal {
        ubtc = new MockERC20("Unit BTC", "UBTC", 18);
        usdxl = new MockERC20("USD XL", "USDXL", 18);

        pool = new MockHypurrFiPool();
        router = new MockSwapRouter();

        vault = new LoopGuardVault(
            address(ubtc),
            address(usdxl),
            address(pool),
            address(router),
            1.9e18, // hfTarget
            1.6e18, // hfSoftFloor
            1.4e18 // hfHardFloor
        );

        // Mint UBTC to this contract (acts as user)
        ubtc.mint(address(this), 1_000e18);
        ubtc.approve(address(vault), type(uint256).max);

        // Liquidity for pool and router
        usdxl.mint(address(pool), 1_000e18);
        ubtc.mint(address(router), 1_000e18);
        usdxl.mint(address(router), 1_000e18);
    }

    function test_DepositAndLoop_CreatesLeverage() public {
        _setUp();

        uint256 amountIn = 10e18;
        vault.depositAndLoop(amountIn);

        // First depositor: 1 share = 1 UBTC
        require(vault.totalShares() == amountIn, "unexpected totalShares");

        // Collateral principal should be > amountIn due to looping
        require(vault.totalCollateralToken() > amountIn, "not leveraged");

        // Some debt should exist
        require(vault.totalDebtToken() > 0, "debt should be > 0");

        // HF should be >= soft floor when we borrowed
        uint256 hf = vault.getHealthFactor();
        require(hf > 1e18, "HF <= 1");
        require(hf >= vault.hfSoftFloor(), "HF below soft floor");
    }

    function test_Withdraw_Half_KeepsHFAboveOne() public {
        _setUp();

        uint256 amountIn = 10e18;
        vault.depositAndLoop(amountIn);

        uint256 half = amountIn / 2;
        vault.withdraw(half);

        uint256 remaining = vault.balanceOf(address(this));
        require(remaining == amountIn - half, "share balance mismatch");

        uint256 hf = vault.getHealthFactor();
        require(hf >= 1e18, "HF < 1 after withdraw");
    }

    function test_Rebalance_NoOp_WhenHealthy() public {
        _setUp();

        uint256 amountIn = 10e18;
        vault.depositAndLoop(amountIn);

        uint256 hfBefore = vault.getHealthFactor();
        require(hfBefore >= vault.hfSoftFloor(), "setup: HF not healthy");

        uint256 collBefore = vault.totalCollateralToken();
        uint256 debtBefore = vault.totalDebtToken();

        vault.rebalance();

        uint256 collAfter = vault.totalCollateralToken();
        uint256 debtAfter = vault.totalDebtToken();
        uint256 hfAfter = vault.getHealthFactor();

        require(collAfter == collBefore, "collateral changed on no-op");
        require(debtAfter == debtBefore, "debt changed on no-op");
        require(hfAfter == hfBefore, "HF changed on no-op");
    }

    function test_Rebalance_ImprovesHF_WhenStressed() public {
        _setUp();

        uint256 amountIn = 10e18;
        vault.depositAndLoop(amountIn);

        uint256 hfAfterDeposit = vault.getHealthFactor();

        // Simulate stress: borrow more USDXL directly in the pool on behalf of the vault
        // This increases totalDebtBase without touching vault.debtPrincipal.
        pool.borrow(address(usdxl), 5e18, 2, 0, address(vault));

        uint256 hfBeforeRebalance = vault.getHealthFactor();
        require(
            hfBeforeRebalance < hfAfterDeposit,
            "HF should drop after extra borrow"
        );
        require(hfBeforeRebalance > 1e18, "setup: HF must stay > 1");

        uint256 collBefore = vault.totalCollateralToken();
        uint256 debtBefore = vault.totalDebtToken();

        vault.rebalance();

        uint256 collAfter = vault.totalCollateralToken();
        uint256 debtAfter = vault.totalDebtToken();
        uint256 hfAfterRebalance = vault.getHealthFactor();

        // Design invariant: HF must not get worse
        require(
            hfAfterRebalance >= hfBeforeRebalance,
            "rebalance did not improve HF"
        );

        // Risk should be reduced: debt should not increase
        require(debtAfter <= debtBefore, "debt did not decrease or stay equal");

        // Collateral should not increase (we sold some to repay)
        require(
            collAfter <= collBefore,
            "collateral did not decrease or stay equal"
        );
    }

    // ------------------------------------------------------------
    // New tests: deposit-only rescue + pausing
    // ------------------------------------------------------------

    function test_DepositOnly_WhenHFAtOrBelowOne() public {
        _setUp();

        uint256 amountIn = 10e18;
        vault.depositAndLoop(amountIn);

        // Push HF down towards/under 1 by borrowing repeatedly on behalf of the vault
        while (true) {
            uint256 hf = vault.getHealthFactor();
            if (hf <= 1e18) {
                break;
            }
            pool.borrow(address(usdxl), 1e18, 2, 0, address(vault));
        }

        uint256 hfBefore = vault.getHealthFactor();
        require(hfBefore <= 1e18, "setup: HF not <= 1");

        uint256 debtBefore = vault.totalDebtToken();
        uint256 collBefore = vault.totalCollateralToken();

        // New deposit should NOT borrow more, just add collateral + shares
        uint256 rescueDeposit = 5e18;
        vault.depositAndLoop(rescueDeposit);

        uint256 debtAfter = vault.totalDebtToken();
        uint256 collAfter = vault.totalCollateralToken();

        // No new principal debt should have been recorded in the vault
        require(debtAfter == debtBefore, "unexpected extra principal debt");

        // Collateral principal increased exactly by the rescue deposit
        require(
            collAfter == collBefore + rescueDeposit,
            "collateral principal mismatch on rescue deposit"
        );
    }

    function test_PauseDeposits_BlocksDeposit() public {
        _setUp();

        vault.pauseDeposits();
        uint256 amountIn = 1e18;

        bool success;
        try vault.depositAndLoop(amountIn) {
            success = true;
        } catch {
            success = false;
        }

        require(!success, "deposit should revert when paused");
    }
}
