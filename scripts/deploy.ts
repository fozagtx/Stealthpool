import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying ConfidentialShadowPool to", network.name);

  const factory = await ethers.getContractFactory("ConfidentialShadowPool");
  const contract = await factory.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ ConfidentialShadowPool deployed at: ${address}`);
  console.log(`   Network: ${network.name}`);
  console.log(`   ChainId: ${network.config.chainId}`);

  // Verify on etherscan if not local
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log(`\n🔍 Verify with:`);
    console.log(`   npx hardhat verify --network ${network.name} ${address}`);
  }
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exitCode = 1;
});
