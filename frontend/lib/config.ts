// ──────────────────────────────────────────────
//  Public Configuration — NOT secrets
//  Chain IDs, network names, RPC defaults, ABIs
// ──────────────────────────────────────────────

export const NETWORKS = {
  hardhat: {
    chainId: 31337,
    name: "Hardhat Local",
    rpc: "http://127.0.0.1:8545",
    currency: "ETH",
    explorer: "",
  },
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpc: "https://sepolia.infura.io/v3/",
    currency: "SepoliaETH",
    explorer: "https://sepolia.etherscan.io",
  },
} as const;

export const DEFAULT_NETWORK = "sepolia" as const;

export const ZAMA = {
  relayerUrl: "https://relayer.zama.ai",
  fhevmVersion: "0.11.1",
} as const;

export const CONTRACT_NAMES = {
  stealthPool: "StealthPool",
} as const;

// ── Deployed contract addresses (hardcoded, not secrets) ──
export const DEPLOYED_ADDRESSES = {
  sepolia: {
    stealthPool: "0x9754ce1CBb685d7269e52e67e92A3130bDCd04e9",
  },
  hardhat: {
    stealthPool: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  },
} as const;

export const STEALTH_POOL_ABI = [
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
  "function getAllActiveIntents() external view returns (bytes32[])",
  "function getUserMatchHistory(address user) external view returns (bytes32[])",
  "function getIntent(bytes32) external view returns (address,address,address,uint256,uint256,bool)",
  "function getMatch(bytes32) external view returns (address,address,address,address,uint256,uint256,uint256)",
];
