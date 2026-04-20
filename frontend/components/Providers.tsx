"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "../lib/wallet";
import { useState, type ReactNode } from "react";
import { HeroUIProvider } from "@heroui/react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider>
          {children}
        </HeroUIProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
