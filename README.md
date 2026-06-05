# 🌑 Confidential ShadowPool

A privacy-preserving dark pool powered by **Zama fhEVM**.

This project reimagines [ShadowPool](https://github.com/Aypp23/shadowpool) — originally built with iExec TEE + Uniswap v4 hooks — using **pure on-chain FHE**. Instead of matching orders in a Trusted Execution Environment off-chain, all encrypted operations happen directly on the fhEVM blockchain.

## Architecture Comparison

| Aspect | Original ShadowPool | Zama ShadowPool |
|--------|-------------------|----------------|
| **Encryption** | iExec TEE (off-chain enclave) | Zama fhEVM (on-chain FHE) |
| **Order Storage** | Off-chain relayer | On-chain encrypted storage |
| **Matching** | TEE decrypts & matches off-chain | FHE comparisons on-chain |
| **Execution** | Uniswap v4 Hook + Merkle proof | Atomic match in fhEVM contract |
| **Settlement** | Hook verifies proof, then swaps | Encrypted match stored, FHE ACL controls decryption |
| **MEV Protection** | Orders hidden in TEE | Orders encrypted with FHE |

## How It Works

1. **Create Intent**: User creates a swap intent with encrypted amounts (`euint128`). Only the creator can decrypt their own amounts.
2. **Discover Intents**: Other users can see which addresses have active intents (and which tokens) but NOT the amounts.
3. **Match**: Any user can match against an intent by submitting their own encrypted amounts.
4. **Private Settlement**: Match details stay encrypted. Both parties can decrypt via the Zama SDK.

## Smart Contract

### `ConfidentialShadowPool.sol`

| Function | Description |
|----------|-------------|
| `createIntent()` | Create encrypted swap intent |
| `cancelIntent()` | Cancel active intent |
| `matchIntent()` | Match against existing intent |
| `getIntentAmountIn()` | Get encrypted amountIn handle |
| `getIntentMinOut()` | Get encrypted minAmountOut handle |
| `getMatchAmountIn/Out()` | Get encrypted match amounts |

## Test Results

```
7 passing, 1 failing (minor helper test assertion)
```

## Getting Started

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Encryption | Zama fhEVM (`@fhevm/solidity`) |
| Typed Data | `euint128` for amounts |
| Framework | Next.js 16 + React 19 |
| Wallet | wagmi + viem |
| FHE SDK | `@zama-fhe/relayer-sdk` |
| Network | Ethereum Sepolia / Hardhat (mock) |

## License
BSD-3-Clause-Clear
