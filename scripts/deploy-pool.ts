import { ethers } from "hardhat";

async function main() {
  const networkName = network.name;
  console.log("\n🚀 Deploying StealthPool");
  console.log(`   Network : ${networkName}`);
  console.log(`   ChainId : ${network.config.chainId}\n`);

  const factory = await ethers.getContractFactory("StealthPool");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ StealthPool deployed!\n`);
  console.log(`   Address : ${address}`);

  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log(`\n🔍 Verify with:`);
    console.log(`   npx hardhat verify --network ${networkName} ${address}`);
    console.log(`\n📝 Add to frontend/.env.local:`);
    console.log(`   NEXT_PUBLIC_POOL_CONTRACT_ADDRESS=${address}`);
  }
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exitCode = 1;
});
