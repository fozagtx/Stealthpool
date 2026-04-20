import { http, createConfig } from "wagmi";
import { sepolia, localhost } from "wagmi/chains";
import { CHAIN_CONFIG } from "./contracts";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [sepolia, localhost],
  connectors: [
    injected({ target: "metaMask" }),
    injected({ target: "coinbaseWallet" }),
  ],
  transports: {
    [sepolia.id]: http(CHAIN_CONFIG.rpcUrl),
    [localhost.id]: http("http://127.0.0.1:8545"),
  },
});
