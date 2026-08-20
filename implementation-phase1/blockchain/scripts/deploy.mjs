import hre from 'hardhat'

const { ethers } = hre
const auditFactory = await ethers.getContractFactory('EnergyAudit')
const audit = await auditFactory.deploy()
await audit.waitForDeployment()

console.log(JSON.stringify({
  contract: 'EnergyAudit',
  address: await audit.getAddress(),
  network: 'hardhat',
}))
