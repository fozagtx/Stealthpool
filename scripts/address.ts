import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const addr = await deployer.getAddress();
  const bal = await ethers.provider.getBalance(addr);
  console.log(`\n📋 Deployer Address: ${addr}`);
  console.log(`💰 Current Balance: ${ethers.formatEther(bal)} ETH`);
  console.log(`\n🔗 Fund with SepoliaETH then run:`);
  console.log(`   npx hardhat run scripts/deploy-pool.ts --network sepolia\n`);
}

main().catch(console.error);
