import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat';
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

import { BackedVault__factory } from '../typechain/factories/contracts/BackedVault__factory';
import { BackedSwap__factory } from '../typechain/factories/contracts/BackedSwap.sol/BackedSwap__factory';
import { BackedFactory__factory} from '../typechain/factories/contracts/BackedFactory/BackedFactory.sol/BackedFactory__factory';
import { BackedOracle__factory} from '../typechain/factories/contracts/BackedFactory/BackedOracle.sol/BackedOracle__factory';
import { MockUSDC__factory} from '../typechain/factories/contracts/BackedFactory/Mocks/StableCoinUSDCMock.sol/MockUSDC__factory';
import { SanctionsListMock__factory} from '../typechain/factories/contracts/BackedFactory/Mocks/SanctionsListMock__factory';
import { BackedTokenImplementation__factory} from '../typechain/factories/contracts/BackedFactory/BackedTokenImplementation__factory';


const { provider, BigNumber } = ethers;

export const ONE_DAY_IN_SECS = 24 * 60 * 60;

export async function deployPoolContractsFixture() {
  const  [Alice, Bob, Caro, Dave]  = await ethers.getSigners();

  const MockUSDC = await ethers.getContractFactory('MockUSDC');
  const MockUSDCContract = await MockUSDC.deploy();
  const mockUSDC = MockUSDC__factory.connect(MockUSDCContract.address, provider);

  const SanctionsListMock = await ethers.getContractFactory('SanctionsListMock');
  const SanctionsListMockContract = await SanctionsListMock.deploy();
  const sanctionsListMock = SanctionsListMock__factory.connect(SanctionsListMockContract.address, provider);

  const BackedOracle = await ethers.getContractFactory('BackedOracle');
  const BackedOracleContract = await BackedOracle.deploy(8, "bIB01 Price Feed");
  const backedOracle = BackedOracle__factory.connect(BackedOracleContract.address, provider);

  const BackedFactory = await ethers.getContractFactory('BackedFactory');
  const BackedFactoryContract = await BackedFactory.deploy(Alice.address);
  const backedFactory = BackedFactory__factory.connect(BackedFactoryContract.address, provider);

  const BackedVault = await ethers.getContractFactory('BackedVault');
  const BackedVaultContract = await BackedVault.deploy();
  const backedVault = BackedVault__factory.connect(BackedVaultContract.address, provider);

  const BackedSwap = await ethers.getContractFactory('BackedSwap');
  const BackedSwapContract = await BackedSwap.deploy();
  const backedSwap  = BackedSwap__factory.connect(BackedSwapContract.address, provider);

  return { mockUSDC, sanctionsListMock, backedOracle, backedFactory, backedSwap, backedVault, Alice, Bob, Caro, Dave };
}

export function expandTo18Decimals(n: number) {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(18));
}

// ensure result is within .01%
export function expectBigNumberEquals(expected: BigNumber, actual: BigNumber) {
  const equals = expected.sub(actual).abs().lte(expected.div(10000));
  if (!equals) {
    console.log(`BigNumber does not equal. expected: ${expected.toString()}, actual: ${actual.toString()}`);
  }
  expect(equals).to.be.true;
}