 "use client";
 
 import { useCallback, useMemo } from "react";
 import { useAccount, useChainId, useConfig } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt, simulateContract } from "wagmi/actions";
 import { ADDRESSES } from "../lib/addresses";
 import { ERC20_ABI, LOOP_GUARD_VAULT_ABI } from "../lib/abi";
 
 export type TxState =
   | { phase: "idle" }
   | { phase: "approving"; hash?: `0x${string}` }
   | { phase: "depositing"; hash?: `0x${string}` }
   | { phase: "withdrawing"; hash?: `0x${string}` }
   | { phase: "rebalancing"; hash?: `0x${string}` }
   | { phase: "success"; hash?: `0x${string}` }
   | { phase: "error"; error: string };
 
 export function useApproveAndDeposit() {
   const config = useConfig();
   const { address } = useAccount();
   const chainId = useChainId();
 
   const run = useCallback(
     async (amountWei: bigint, onPhase?: (s: TxState) => void) => {
       if (!address) {
         onPhase?.({ phase: "error", error: "Wallet not connected" });
         return;
       }
       try {
        // 0) Resolve collateral token from vault config; fallback to collateral(); finally env
        let collateralToken: `0x${string}` | undefined;
        try {
          const cfg = (await readContract(config, {
            address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
            abi: LOOP_GUARD_VAULT_ABI,
            functionName: "getConfig",
          })) as readonly [`0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`, bigint, bigint, bigint];
          collateralToken = cfg[0];
        } catch {}
        if (!collateralToken) {
          try {
            const col = (await readContract(config, {
              address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
              abi: LOOP_GUARD_VAULT_ABI,
              functionName: "collateral",
            })) as `0x${string}`;
            collateralToken = col;
          } catch {}
        }
        if (!collateralToken || !/^0x[0-9a-fA-F]{40}$/.test(collateralToken)) {
          const fromEnv = ADDRESSES.HYPE as `0x${string}`;
          if (!fromEnv || /^0x0{40}$/i.test(fromEnv)) {
            onPhase?.({ phase: "error", error: "Could not resolve collateral token (getConfig/collateral/env failed)" });
            return;
          }
          collateralToken = fromEnv;
        }

        // 1) Check allowance on the collateral token
         const allowance = (await readContract(config, {
          address: collateralToken,
           abi: ERC20_ABI,
           functionName: "allowance",
           args: [address, ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`],
         })) as bigint;
 
         if (allowance < amountWei) {
           // 2) Approve
           const approveHash = await writeContract(config, {
            address: collateralToken,
             abi: ERC20_ABI,
             functionName: "approve",
             args: [ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`, amountWei],
             chainId,
           });
           onPhase?.({ phase: "approving", hash: approveHash });
           await waitForTransactionReceipt(config, { hash: approveHash, confirmations: 1 });
         }
 
        // 3) Simulate deposit
        await simulateContract(config, {
          address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
          abi: LOOP_GUARD_VAULT_ABI,
          functionName: "depositAndLoop",
          args: [amountWei],
          chainId,
          account: address,
        });

        // 4) Deposit
         const depositHash = await writeContract(config, {
           address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
           abi: LOOP_GUARD_VAULT_ABI,
           functionName: "depositAndLoop",
           args: [amountWei],
           chainId,
         });
         onPhase?.({ phase: "depositing", hash: depositHash });
         await waitForTransactionReceipt(config, { hash: depositHash, confirmations: 1 });
         onPhase?.({ phase: "success", hash: depositHash });
       } catch (e: any) {
         const message = e?.shortMessage || e?.message || "Transaction failed";
         onPhase?.({ phase: "error", error: message });
       }
     },
     [address, chainId, config]
   );
 
   return { run };
 }
 
export function useDepositBorrowNoSwap() {
  const config = useConfig();
  const { address } = useAccount();
  const chainId = useChainId();

  const run = useCallback(
    async (amountWei: bigint, borrowBps: number, onPhase?: (s: TxState) => void) => {
      if (!address) {
        onPhase?.({ phase: "error", error: "Wallet not connected" });
        return;
      }
      try {
        // Resolve collateral: getConfig() -> collateral() -> env
        let collateralToken: `0x${string}` | undefined;
        try {
          const cfg = (await readContract(config, {
            address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
            abi: LOOP_GUARD_VAULT_ABI,
            functionName: "getConfig",
          })) as readonly [`0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`, bigint, bigint, bigint];
          collateralToken = cfg[0];
        } catch {}
        if (!collateralToken) {
          try {
            const col = (await readContract(config, {
              address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
              abi: LOOP_GUARD_VAULT_ABI,
              functionName: "collateral",
            })) as `0x${string}`;
            collateralToken = col;
          } catch {}
        }
        if (!collateralToken || !/^0x[0-9a-fA-F]{40}$/.test(collateralToken)) {
          const fromEnv = ADDRESSES.HYPE as `0x${string}`;
          if (!fromEnv || /^0x0{40}$/i.test(fromEnv)) {
            onPhase?.({ phase: "error", error: "Could not resolve collateral token (getConfig/collateral/env failed)" });
            return;
          }
          collateralToken = fromEnv;
        }

        // Approve if needed
        const allowance = (await readContract(config, {
          address: collateralToken,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`],
        })) as bigint;
        if (allowance < amountWei) {
          const approveHash = await writeContract(config, {
            address: collateralToken,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`, amountWei],
            chainId,
          });
          onPhase?.({ phase: "approving", hash: approveHash });
          await waitForTransactionReceipt(config, { hash: approveHash, confirmations: 1 });
        }

        // Simulate
        await simulateContract(config, {
          address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
          abi: LOOP_GUARD_VAULT_ABI,
          functionName: "depositAndBorrowNoSwap",
          args: [amountWei, BigInt(borrowBps)],
          chainId,
          account: address,
        });

        // Send tx
        const txHash = await writeContract(config, {
          address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
          abi: LOOP_GUARD_VAULT_ABI,
          functionName: "depositAndBorrowNoSwap",
          args: [amountWei, BigInt(borrowBps)],
          chainId,
        });
        onPhase?.({ phase: "depositing", hash: txHash });
        await waitForTransactionReceipt(config, { hash: txHash, confirmations: 1 });
        onPhase?.({ phase: "success", hash: txHash });
       } catch (e: any) {
         const message = e?.shortMessage || e?.message || "Transaction failed";
         onPhase?.({ phase: "error", error: message });
       }
     },
     [address, chainId, config]
   );
 
   return { run };
 }
 
 export function useWithdrawAll() {
   const config = useConfig();
   const chainId = useChainId();
 
   const run = useCallback(
     async (userShares: bigint, onPhase?: (s: TxState) => void) => {
       try {
         if (userShares === 0n) {
           onPhase?.({ phase: "error", error: "No shares to withdraw" });
           return;
         }
        // Simulate withdraw
        await simulateContract(config, {
          address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
          abi: LOOP_GUARD_VAULT_ABI,
          functionName: "withdraw",
          args: [userShares],
          chainId,
        });
         const hash = await writeContract(config, {
           address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
           abi: LOOP_GUARD_VAULT_ABI,
           functionName: "withdraw",
           args: [userShares],
           chainId,
         });
         onPhase?.({ phase: "withdrawing", hash });
         await waitForTransactionReceipt(config, { hash, confirmations: 1 });
         onPhase?.({ phase: "success", hash });
       } catch (e: any) {
         onPhase?.({ phase: "error", error: e?.shortMessage || e?.message || "Withdraw failed" });
       }
     },
     [chainId, config]
   );
 
   return { run };
 }
 
 export function useRebalance() {
   const config = useConfig();
   const chainId = useChainId();
 
   const run = useCallback(
     async (onPhase?: (s: TxState) => void) => {
       try {
        // Simulate rebalance
        await simulateContract(config, {
          address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
          abi: LOOP_GUARD_VAULT_ABI,
          functionName: "rebalance",
          args: [],
          chainId,
        });
         const hash = await writeContract(config, {
           address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
           abi: LOOP_GUARD_VAULT_ABI,
           functionName: "rebalance",
           args: [],
           chainId,
         });
         onPhase?.({ phase: "rebalancing", hash });
         await waitForTransactionReceipt(config, { hash, confirmations: 1 });
         onPhase?.({ phase: "success", hash });
       } catch (e: any) {
         onPhase?.({ phase: "error", error: e?.shortMessage || e?.message || "Rebalance failed" });
       }
     },
     [chainId, config]
   );
 
   return { run };
 }
 

