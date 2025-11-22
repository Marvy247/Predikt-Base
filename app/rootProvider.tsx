"use client";
import { ReactNode } from "react";
import { base } from "viem/chains";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { BASE_MAINNET_RPC_URL } from "./constants";
import { wagmiAdapter, queryClient } from "@/lib/reown-config";

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
          rpcUrl={BASE_MAINNET_RPC_URL}
          config={{
            appearance: {
              mode: "auto",
            },
            wallet: {
              display: "modal",
              preference: "all",
            },
          }}
          miniKit={{
            enabled: true,
            autoConnect: true,
            notificationProxyUrl: undefined,
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
