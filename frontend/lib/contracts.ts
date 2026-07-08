import { NETWORKS, DEFAULT_NETWORK, ZAMA, DEPLOYED_ADDRESSES, STEALTH_POOL_ABI } from "./config";

// ── All non-secret config is in code ──
const chain = NETWORKS[DEFAULT_NETWORK];

export const CONTRACT_ADDRESSES = {
  stealthPool: DEPLOYED_ADDRESSES[DEFAULT_NETWORK].stealthPool,
};

export const CHAIN_CONFIG = {
  chainId: chain.chainId,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || `${chain.rpc}${process.env.NEXT_PUBLIC_INFURA_KEY || ""}`,
  relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || ZAMA.relayerUrl,
  currency: chain.currency,
};

export { STEALTH_POOL_ABI };
