 import type { Abi } from "viem";
 
 // Replace these with the real ABIs you will provide.
 export const LOOP_GUARD_VAULT_ABI: Abi = [
   // getVaultStatus() -> (totalShares, totalCollateralBase, totalDebtBase, availableBorrowsBase, healthFactor)
   {
     type: "function",
     name: "getVaultStatus",
     stateMutability: "view",
     inputs: [],
     outputs: [
       { name: "totalShares", type: "uint256" },
       { name: "totalCollateralBase", type: "uint256" },
       { name: "totalDebtBase", type: "uint256" },
       { name: "availableBorrowsBase", type: "uint256" },
       { name: "healthFactor", type: "uint256" },
     ],
   },
   // Optional getters if available (hfTarget, hfSoftFloor, hfHardFloor)
   { type: "function", name: "hfTarget", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
   { type: "function", name: "hfSoftFloor", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
   { type: "function", name: "hfHardFloor", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
   // User-level position
   {
     type: "function",
     name: "getUserPosition",
     stateMutability: "view",
     inputs: [{ name: "user", type: "address" }],
     outputs: [
       { name: "userShares", type: "uint256" },
       { name: "userShareOfCollateralBase", type: "uint256" },
       { name: "userShareOfDebtBase", type: "uint256" },
       { name: "userHealthFactorEstimate", type: "uint256" },
     ],
   },
   // Actions
   {
     type: "function",
     name: "depositAndLoop",
     stateMutability: "nonpayable",
     inputs: [{ name: "amount", type: "uint256" }],
     outputs: [],
   },
  // Alternative entrypoint: deposit and borrow without swaps
  {
    type: "function",
    name: "depositAndBorrowNoSwap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "borrowBps", type: "uint256" },
    ],
    outputs: [],
  },
   {
     type: "function",
     name: "withdraw",
     stateMutability: "nonpayable",
     inputs: [{ name: "shares", type: "uint256" }],
     outputs: [],
   },
   {
     type: "function",
     name: "rebalance",
     stateMutability: "nonpayable",
     inputs: [],
     outputs: [],
   },
  // Config
  {
    type: "function",
    name: "getConfig",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "collateralToken", type: "address" },
      { name: "debtToken", type: "address" },
      { name: "hypurrPool", type: "address" },
      { name: "swapRouter", type: "address" },
      { name: "hfTarget", type: "uint256" },
      { name: "hfSoftFloor", type: "uint256" },
      { name: "hfHardFloor", type: "uint256" },
    ],
  },
  // Fallback getters for older deployments
  { type: "function", name: "collateral", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "debt", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "pool", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "router", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
 ] satisfies Abi;
 
 export const ERC20_ABI: Abi = [
   { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
   { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
   {
     type: "function",
     name: "allowance",
     stateMutability: "view",
     inputs: [
       { name: "owner", type: "address" },
       { name: "spender", type: "address" },
     ],
     outputs: [{ type: "uint256" }],
   },
   {
     type: "function",
     name: "approve",
     stateMutability: "nonpayable",
     inputs: [
       { name: "spender", type: "address" },
       { name: "amount", type: "uint256" },
     ],
     outputs: [{ type: "bool" }],
   },
 ] satisfies Abi;
 

