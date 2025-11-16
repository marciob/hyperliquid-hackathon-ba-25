 "use client";
 
 import React from "react";
 import { createConfig, http, WagmiProvider as CoreWagmiProvider } from "wagmi";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import type { Chain } from "wagmi/chains";
 import { injected } from "wagmi/connectors";
 
 // Minimal HyperEVM chain (mainnet) config (id = 999)
 export const hyperEvm: Chain = {
   id: 999,
   name: "HyperEVM",
   nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
   rpcUrls: {
     default: { http: ["https://rpc.hyperliquid.xyz/evm"] },
   },
 } as const;
 
 const wagmiConfig = createConfig({
   chains: [hyperEvm],
   transports: {
     [hyperEvm.id]: http(hyperEvm.rpcUrls.default.http[0]),
   },
   connectors: [
     injected({
       shimDisconnect: true,
     }),
   ],
   multiInjectedProviderDiscovery: true,
   ssr: true,
 });
 
 const queryClient = new QueryClient();
 
 export function WagmiProvider({ children }: { children: React.ReactNode }) {
   return (
     <CoreWagmiProvider config={wagmiConfig}>
       <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
     </CoreWagmiProvider>
   );
 }
 
 export default WagmiProvider;
 

