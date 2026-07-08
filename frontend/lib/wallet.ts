import { http, createConfig } from "wagmi";
import { sepolia, localhost } from "wagmi/chains";
import { NETWORKS } from "./config";
import { injected } from "wagmi/connectors";

const isSepolia = process.env.NEXT_PUBLIC_CHAIN
  ? process.env.NEXT_PUBLIC_CHAIN === "sepolia"
  : true;

const activeChain = isSepolia
  ? { ...sepolia, id: NETWORKS.sepolia.chainId, name: NETWORKS.sepolia.name, nativeCurrency: { name: NETWORKS.sepolia.currency, symbol: "ETH", decimals: 18 } }
  : { ...localhost, id: NETWORKS.hardhat.chainId, name: NETWORKS.hardhat.name };

export const wagmiConfig = createConfig({
  chains: [activeChain],
  connectors: [injected({ target: "metaMask" })],
  transports: {
    [activeChain.id]: http(),
  },
});
