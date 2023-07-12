import { expect } from 'chai'
import { ethers } from 'hardhat';

const { BigNumber } = ethers;

export const ONE_DAY_IN_SECS = 24 * 60 * 60;

export async function deployPoolContractsFixture() {
  const  [Alice, Bob, Caro, Dave]  = await ethers.getSigners();

  const MockUSDC = await ethers.getContractFactory('MockUSDC');
  const mockUSDC = await MockUSDC.deploy();

  const SanctionsListMock = await ethers.getContractFactory('SanctionsListMock');
  const sanctionsListMock = await SanctionsListMock.deploy();

  const BackedOracle = await ethers.getContractFactory('BackedOracle');
  const backedOracle = await BackedOracle.deploy(8, "bIB01 Price Feed");

  const BackedFactory = await ethers.getContractFactory('BackedFactory');
  const backedFactory = await BackedFactory.deploy(Alice.address);

  const BackedVault = await ethers.getContractFactory('BackedVault');
  const backedVault = await BackedVault.deploy();

  const BackedSwap = await ethers.getContractFactory('BackedSwap');
  const backedSwap = await BackedSwap.deploy();

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
