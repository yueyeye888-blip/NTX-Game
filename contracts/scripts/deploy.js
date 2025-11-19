const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...");

  // 1. 部署 Mock Token (因为您提到代币合约未定，我们先部署一个临时的)
  const MockNTX = await hre.ethers.getContractFactory("MockNTX");
  const ntx = await MockNTX.deploy();
  await ntx.waitForDeployment();
  const ntxAddress = await ntx.getAddress();
  console.log(`✅ MockNTX deployed to: ${ntxAddress}`);

  // 2. 部署 BullArena
  const BullArena = await hre.ethers.getContractFactory("BullArena");
  
  // 获取部署者地址作为临时的 Treasury 地址
  const [deployer] = await hre.ethers.getSigners();
  
  // 构造函数参数: token地址, treasury地址
  const arena = await BullArena.deploy(ntxAddress, deployer.address);
  await arena.waitForDeployment();
  const arenaAddress = await arena.getAddress();

  console.log(`✅ BullArena deployed to: ${arenaAddress}`);
  
  console.log("\n📋 Deployment Summary:");
  console.log("--------------------");
  console.log(`Token:    ${ntxAddress}`);
  console.log(`Arena:    ${arenaAddress}`);
  console.log(`Treasury: ${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
