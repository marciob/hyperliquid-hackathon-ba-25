// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Simplified router: swapExactTokensForTokens only
interface ISwapRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to
    ) external returns (uint256 amountOut);
}


