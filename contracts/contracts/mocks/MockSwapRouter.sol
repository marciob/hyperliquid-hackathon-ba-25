// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISwapRouter.sol";
import "../interfaces/IERC20.sol";

contract MockSwapRouter is ISwapRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to
    ) external override returns (uint256 amountOut) {
        require(path.length >= 2, "path too short");

        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];

        // pull tokenIn from caller (the vault)
        require(
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
            "router transferFrom failed"
        );

        // 1:1 swap for tests
        amountOut = amountIn;
        require(amountOut >= amountOutMin, "slippage");

        require(
            IERC20(tokenOut).transfer(to, amountOut),
            "router transfer out failed"
        );
    }
}
