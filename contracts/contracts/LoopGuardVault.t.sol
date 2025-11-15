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

        require(vault.totalShares() == amountIn, "unexpected totalShares");
        require(vault.totalCollateralToken() > amountIn, "not leveraged");
        require(vault.totalDebtToken() > 0, "debt should be > 0");

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
}
