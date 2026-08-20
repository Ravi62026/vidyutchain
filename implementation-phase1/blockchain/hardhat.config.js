import '@nomicfoundation/hardhat-toolbox'

export default {
  solidity: '0.8.26',
  paths: {
    sources: './contracts',
    tests: './test',
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
  },
}
