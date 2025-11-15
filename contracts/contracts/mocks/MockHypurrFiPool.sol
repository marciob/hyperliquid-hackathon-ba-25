// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IHypurrFiPool.sol";
import "../interfaces/IERC20.sol";

contract MockHypurrFiPool is IHypurrFiPool {
    struct Position {
        uint256 collateral;
        uint256 debt;
    }

    mapping(address => Position) public positions;

    uint256 public constant LTV_BPS = 7000; // 70% LTV
    uint256 public constant LT_BPS = 8000; // 80% liquidation threshold

    // deposit collateral from msg.sender, credit onBehalfOf
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 /*referralCode*/
    ) external override {
        require(
            IERC20(asset).transferFrom(msg.sender, address(this), amount),
            "supply transfer failed"
        );
        positions[onBehalfOf].collateral += amount;
    }

    // borrow to onBehalfOf
    function borrow(
        address asset,
        uint256 amount,
        uint256 /*interestRateMode*/,
        uint16 /*referralCode*/,
        address onBehalfOf
    ) external override {
        positions[onBehalfOf].debt += amount;
        require(
            IERC20(asset).transfer(onBehalfOf, amount),
            "borrow transfer failed"
        );
    }

    // repay from msg.sender, reduce onBehalfOf's debt
    function repay(
        address asset,
        uint256 amount,
        uint256 /*rateMode*/,
        address onBehalfOf
    ) external override returns (uint256) {
        Position storage p = positions[onBehalfOf];
        uint256 repayAmount = amount > p.debt ? p.debt : amount;

        if (repayAmount == 0) return 0;

        require(
            IERC20(asset).transferFrom(msg.sender, address(this), repayAmount),
            "repay transfer failed"
        );

        p.debt -= repayAmount;
        return repayAmount;
    }

    // withdraw collateral owned by msg.sender
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256) {
        Position storage p = positions[msg.sender];
        require(p.collateral >= amount, "not enough collateral");

        p.collateral -= amount;

        require(IERC20(asset).transfer(to, amount), "withdraw transfer failed");

        return amount;
    }

    // HF ~ (collateral * LT) / debt, prices = 1:1
    function getUserAccountData(
        address user
    )
        external
        view
        override
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        )
    {
        Position storage p = positions[user];

        totalCollateralBase = p.collateral;
        totalDebtBase = p.debt;
        currentLiquidationThreshold = LT_BPS;
        ltv = LTV_BPS;

        if (totalCollateralBase == 0) {
            availableBorrowsBase = 0;
            healthFactor = type(uint256).max;
        } else {
            uint256 maxBorrow = (totalCollateralBase * LTV_BPS) / 10_000;
            if (maxBorrow <= totalDebtBase) {
                availableBorrowsBase = 0;
            } else {
                availableBorrowsBase = maxBorrow - totalDebtBase;
            }

            if (totalDebtBase == 0) {
                healthFactor = type(uint256).max;
            } else {
                // 1e18-scaled HF
                healthFactor =
                    (totalCollateralBase * LT_BPS * 1e18) /
                    (totalDebtBase * 10_000);
            }
        }
    }
}
