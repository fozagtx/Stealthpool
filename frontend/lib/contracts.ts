export const CONTRACT_ADDRESSES = {
  confidentialShadowPool: process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS as string,
};

export const CHAIN_CONFIG = {
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111"),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.infura.io/v3/zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
  relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || "https://relayer.zama.ai",
};

export const POOL_ABI = [
  "function createIntent(address tokenIn, address tokenOut, externalEuint128 encryptedAmountIn, bytes calldata proofAmountIn, externalEuint128 encryptedMinOut, bytes calldata proofMinOut, uint256 deadline) external",
  "function cancelIntent(bytes32 intentId) external",
  "function matchIntent(bytes32 intentAId, externalEuint128 encryptedAmountIn, bytes calldata proofAmountIn, externalEuint128 encryptedAmountOut, bytes calldata proofAmountOut) external",
  "function getActiveIntentId(address user) external view returns (bytes32)",
  "function getIntentAmountIn(bytes32 intentId) external view returns (euint128)",
  "function getIntentMinOut(bytes32 intentId) external view returns (euint128)",
  "function getMatchAmountIn(bytes32 matchId) external view returns (euint128)",
  "function getMatchAmountOut(bytes32 matchId) external view returns (euint128)",
  "function hasActiveIntent(address user) external view returns (bool)",
  "function isIntentActive(bytes32 intentId) external view returns (bool)",
];
