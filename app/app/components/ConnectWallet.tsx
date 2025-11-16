 "use client";
 
 import React from "react";
 import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
 import { hyperEvm } from "../providers/WagmiProvider";
 
 export function ConnectWallet() {
   const { isConnected, address } = useAccount();
   const { connectors, connect, status: connectStatus, error: connectError } = useConnect();
   const { disconnect } = useDisconnect();
   const chainId = useChainId();
   const { switchChain, isPending: isSwitching } = useSwitchChain();
 
   const onConnect = () => {
     // Prefer injected first
     const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];
     if (injected) connect({ connector: injected });
   };
 
   const needsSwitch = isConnected && chainId !== hyperEvm.id;
 
   if (!isConnected) {
     return (
       <button
         onClick={onConnect}
         className="rounded-full border border-[#C6EFFF33] bg-surface-alt px-3 py-1 text-xs font-medium text-brand-sky hover:bg-[#C6EFFF1A]"
         disabled={connectStatus === "pending"}
       >
         {connectStatus === "pending" ? "Connecting…" : "Connect Wallet"}
       </button>
     );
   }
 
   return (
     <div className="inline-flex items-center gap-2">
       {needsSwitch ? (
         <button
           onClick={() => switchChain({ chainId: hyperEvm.id })}
           disabled={isSwitching}
           className="rounded-full border border-[#F7EF9A66] bg-[#F7EF9A20] px-3 py-1 text-xs font-medium text-brand-yellow"
         >
           {isSwitching ? "Switching…" : "Switch to HyperEVM"}
         </button>
       ) : (
         <span className="inline-flex items-center rounded-full border border-[#C6EFFF33] bg-surface-alt px-3 py-1 text-xs font-medium text-brand-sky">
           {shortAddress(address)}
         </span>
       )}
       <button
         onClick={() => disconnect()}
         className="rounded-full border border-[#C6EFFF22] bg-transparent px-3 py-1 text-xs text-[#94A3B8] hover:bg-[#C6EFFF1A]"
       >
         Disconnect
       </button>
       {connectError ? (
         <span className="text-xs text-brand-pink">{connectError.message ?? "Connection error"}</span>
       ) : null}
     </div>
   );
 }
 
 function shortAddress(addr?: string) {
   if (!addr) return "";
   return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
 }
 
 export default ConnectWallet;
 

