import 'dotenv/config';
import '@typechain/hardhat';
import 'hardhat-abi-exporter';
import 'hardhat-gas-reporter';
import 'hardhat-deploy';
import '@nomicfoundation/hardhat-toolbox';
import "@nomiclabs/hardhat-truffle5";
import '@openzeppelin/hardhat-upgrades';
import { HardhatUserConfig } from 'hardhat/config';
import { NetworkUserConfig } from 'hardhat/types';

const chainIds = {
  hardhat: 31337,
  ganache: 1337,
  mainnet: 1,
  goerli: 5,
  sepolia: 11155111,
};

// Ensure that we have all the environment variables we need.
const privateKey: string = process.env.PRIVATE_KEY || '';
const infuraKey: string = process.env.INFURA_KEY || '';

const accounts = require("./hardhatAccountsList2k.js");
const accountsList = accounts.accountsList

function createTestnetConfig(network: keyof typeof chainIds): NetworkUserConfig {
  if (!infuraKey) {
    throw new Error('Missing INFURA_KEY');
  }

  let nodeUrl;
  switch (network) {
    case 'mainnet':
      nodeUrl = `https://mainnet.infura.io/v3/${infuraKey}`;
      break;
    case 'goerli':
      nodeUrl = `https://goerli.infura.io/v3/${infuraKey}`;
      break;
    case 'sepolia':
      nodeUrl = `https://sepolia.infura.io/v3/${infuraKey}`;
      break;
  }

  return {
    chainId: chainIds[network],
    url: nodeUrl,
    accounts: [`${privateKey}`],
  };
}

const config: HardhatUserConfig = {
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
  },
  solidity: {
    compilers: [
      {
        version: '0.8.9',
        settings: {
          metadata: {
            bytecodeHash: 'ipfs',
          },
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.4.18',
      },
      {
        version: '0.4.23',
      },
      {
        version: '0.5.16',
      },
      {
        version: '0.6.6',
      },
      {
        version: '0.6.11',
        settings: {
          optimizer: {
            enabled: true,
            runs: 100
          }
        }
      },
    ],
  },
  abiExporter: {
    flat: true,
  },
  mocha: {
    parallel: false,
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_KEY || '',
      goerli: process.env.ETHERSCAN_KEY || '',
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
};

if (privateKey) {
  config.networks = {
    mainnet: createTestnetConfig('mainnet'),
    goerli: createTestnetConfig('goerli'),
    sepolia: createTestnetConfig('sepolia'),
  };
}

config.networks = {
  ...config.networks,
  hardhat: {
    chainId: 1337,
    gas: 'auto',
    gasPrice: 'auto',
    allowUnlimitedContractSize: true,
    accounts: accountsList,
  },
};

export default config;
