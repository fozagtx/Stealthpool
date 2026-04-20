import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";
import { CHAIN_CONFIG } from "./contracts";

let fhevmInstance: Awaited<ReturnType<typeof createInstance>> | null = null;

async function getInstance() {
  if (!fhevmInstance) {
    fhevmInstance = await createInstance({
      ...SepoliaConfig,
      network: CHAIN_CONFIG.rpcUrl,
      relayerUrl: CHAIN_CONFIG.relayerUrl,
      chainId: CHAIN_CONFIG.chainId,
    });
  }
  return fhevmInstance;
}

/**
 * Create an encrypted input session bound to the pool contract.
 */
export async function createEncryptedInput(contractAddress: string, userAddress: string) {
  const instance = await getInstance();
  return instance.createEncryptedInput(contractAddress, userAddress);
}

/**
 * Decrypt a euint128 handle to a plaintext number.
 */
export async function decryptEuint128(handle: `0x${string}`, userAddress: string, contractAddress: string): Promise<bigint> {
  const instance = await getInstance();
  const result = await instance.userDecrypt(
    [{ handle, contractAddress }],
    "",  // privateKey - requires KMS integration
    "",  // publicKey
    "",  // signature
    [contractAddress],
    userAddress,
    Math.floor(Date.now() / 1000),
    1,   // 1 day duration
  );
  return result[handle as any] as bigint;
}


