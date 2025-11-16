 "use client";
 
 import { useAccount } from "wagmi";
 import { useMemo } from "react";
 import { useReadContract } from "wagmi";
 import { ADDRESSES } from "../lib/addresses";
 import { LOOP_GUARD_VAULT_ABI } from "../lib/abi";
 
 export function useVaultStatus() {
   const { data, error, isLoading, refetch } = useReadContract({
     abi: LOOP_GUARD_VAULT_ABI,
     address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
     functionName: "getVaultStatus",
     query: {
       refetchInterval: 10_000,
     },
   });
 
   const status = useMemo(() => {
     if (!data) return undefined;
     const [totalShares, totalCollateralBase, totalDebtBase, availableBorrowsBase, healthFactor] = data as unknown as [
       bigint,
       bigint,
       bigint,
       bigint,
       bigint
     ];
     return {
       totalShares,
       totalCollateralBase,
       totalDebtBase,
       availableBorrowsBase,
       healthFactor,
     };
   }, [data]);
 
   return { status, error, isLoading, refetch };
 }
 
 export function useVaultThresholds() {
   const hfTarget = useReadContract({
     abi: LOOP_GUARD_VAULT_ABI,
     address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
     functionName: "hfTarget",
   });
   const hfSoftFloor = useReadContract({
     abi: LOOP_GUARD_VAULT_ABI,
     address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
     functionName: "hfSoftFloor",
   });
   const hfHardFloor = useReadContract({
     abi: LOOP_GUARD_VAULT_ABI,
     address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
     functionName: "hfHardFloor",
   });
 
   const data = useMemo(() => {
     return {
       hfTarget: hfTarget.data as bigint | undefined,
       hfSoftFloor: hfSoftFloor.data as bigint | undefined,
       hfHardFloor: hfHardFloor.data as bigint | undefined,
     };
   }, [hfTarget.data, hfSoftFloor.data, hfHardFloor.data]);
 
   return {
     data,
     isLoading: hfTarget.isLoading || hfSoftFloor.isLoading || hfHardFloor.isLoading,
     error: hfTarget.error || hfSoftFloor.error || hfHardFloor.error,
   };
 }
 
 export function useUserPosition() {
   const { address } = useAccount();
   const { data, error, isLoading, refetch } = useReadContract({
     abi: LOOP_GUARD_VAULT_ABI,
     address: ADDRESSES.LOOP_GUARD_VAULT as `0x${string}`,
     functionName: "getUserPosition",
     args: [address ?? "0x0000000000000000000000000000000000000000"],
     query: {
       enabled: Boolean(address),
       refetchInterval: 10_000,
     },
   });
 
   const position = useMemo(() => {
     if (!data) return undefined;
     const [userShares, userShareOfCollateralBase, userShareOfDebtBase, userHealthFactorEstimate] = data as unknown as [
       bigint,
       bigint,
       bigint,
       bigint
     ];
     return { userShares, userShareOfCollateralBase, userShareOfDebtBase, userHealthFactorEstimate };
   }, [data]);
 
   return { position, error, isLoading, refetch };
 }
 

