import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { BACKED_TOKEN_ADDRESS, CHAINID } from "../constants/constants";

const deployFunction: DeployFunction = async function ({
  deployments,
  ethers,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId as CHAINID;

  const activePoolAddress = (await deployments.get('ActivePool')).address;
  const backedTokenAddress = BACKED_TOKEN_ADDRESS[chainId] || (await deployments.get('BackedToken')).address;
  const b2bStakingAddress = (await deployments.get('B2BStaking')).address;
  const b2bTokenAddress = (await deployments.get('B2BToken')).address;
  const borrowerOperationsAddress = (await deployments.get('BorrowerOperations')).address;
  const busdcTokenAddress = (await deployments.get('BUSDCToken')).address;
  const collSurplusPoolAddress = (await deployments.get('CollSurplusPool')).address;
  const communityIssuanceAddress = (await deployments.get('CommunityIssuance')).address;
  const defaultPoolAddress = (await deployments.get('DefaultPool')).address;
  const gasPoolAddress = (await deployments.get('GasPool')).address;
  const priceFeedAddress = (await deployments.get('BackedOracleProxy')).address;
  const sortedTrovesAddress = (await deployments.get('SortedTroves')).address;
  const stabilityPoolAddress = (await deployments.get('StabilityPool')).address;
  const troveManagerAddress = (await deployments.get('TroveManager')).address;
  const stableMintControllerAddress = (await deployments.get('StableMintController')).address;

  const activePoolContract = await ethers.getContractAt('ActivePool', (await deployments.get('ActivePool')).address);
  if ((await activePoolContract.owner()) === deployer) {
    const tx = await activePoolContract.setAddresses(
      borrowerOperationsAddress,
      troveManagerAddress,
      stabilityPoolAddress,
      defaultPoolAddress,
      backedTokenAddress
    );
    await tx.wait();
  }

  const B2BStakingContract = await ethers.getContractAt('B2BStaking', (await deployments.get('B2BStaking')).address);
  if ((await B2BStakingContract.owner()) === deployer) {
    const tx = await B2BStakingContract.setAddresses(
      b2bTokenAddress,
      busdcTokenAddress,
      troveManagerAddress,
      borrowerOperationsAddress,
      activePoolAddress,
      backedTokenAddress
    );
    await tx.wait();
  }

  const borrowerOperationsContract = await ethers.getContractAt(
    'BorrowerOperations',
    (
      await deployments.get('BorrowerOperations')
    ).address
  );
  if ((await borrowerOperationsContract.owner()) === deployer) {
    const tx = await borrowerOperationsContract.setAddresses(
      troveManagerAddress,
      activePoolAddress,
      defaultPoolAddress,
      stabilityPoolAddress,
      gasPoolAddress,
      collSurplusPoolAddress,
      priceFeedAddress,
      sortedTrovesAddress,
      busdcTokenAddress,
      b2bStakingAddress,
      backedTokenAddress,
      stableMintControllerAddress
    );
    await tx.wait();
  }

  const collSurplusPoolContract = await ethers.getContractAt('CollSurplusPool', (await deployments.get('CollSurplusPool')).address);
  if ((await collSurplusPoolContract.owner()) === deployer) {
    const tx = await collSurplusPoolContract.setAddresses(
      borrowerOperationsAddress,
      troveManagerAddress,
      activePoolAddress,
      backedTokenAddress
    );
    await tx.wait();
  }

  const communityIssuanceContract = await ethers.getContractAt(
    'CommunityIssuance',
    (
      await deployments.get('CommunityIssuance')
    ).address
  );
  if ((await communityIssuanceContract.owner()) === deployer) {
    const tx = await communityIssuanceContract.setAddresses(b2bTokenAddress, stabilityPoolAddress);
    await tx.wait();
  }

  const defaultPoolContract = await ethers.getContractAt('DefaultPool', (await deployments.get('DefaultPool')).address);
  if ((await defaultPoolContract.owner()) === deployer) {
    const tx = await defaultPoolContract.setAddresses(troveManagerAddress, activePoolAddress, backedTokenAddress);
    await tx.wait();
  }

  const hintHelpersContract = await ethers.getContractAt('HintHelpers', (await deployments.get('HintHelpers')).address);
  if ((await hintHelpersContract.owner()) === deployer) {
    const tx = await hintHelpersContract.setAddresses(sortedTrovesAddress, troveManagerAddress);
    await tx.wait();
  }

  const lockupContractFactoryContract = await ethers.getContractAt('LockupContractFactory', (await deployments.get('LockupContractFactory')).address);
  if ((await lockupContractFactoryContract.owner()) === deployer) {
    const tx = await lockupContractFactoryContract.setB2BTokenAddress(b2bTokenAddress);
    await tx.wait();
  }

  const sortedTrovesContract = await ethers.getContractAt('SortedTroves', (await deployments.get('SortedTroves')).address);
  if ((await sortedTrovesContract.owner()) === deployer) {
    const size = ethers.constants.MaxUint256;
    const tx = await sortedTrovesContract.setParams(size, troveManagerAddress, borrowerOperationsAddress);
    await tx.wait();
  }

  const stabilityPoolContract = await ethers.getContractAt(
    'StabilityPool',
    (
      await deployments.get('StabilityPool')
    ).address
  );
  if ((await stabilityPoolContract.owner()) === deployer) {
    const tx = await stabilityPoolContract.setAddresses(
      borrowerOperationsAddress,
      troveManagerAddress,
      activePoolAddress,
      busdcTokenAddress,
      sortedTrovesAddress,
      priceFeedAddress,
      communityIssuanceAddress,
      backedTokenAddress,
      stableMintControllerAddress
    );
    await tx.wait();
  }

  const troveManagerContract = await ethers.getContractAt(
    'TroveManager',
    (
      await deployments.get('TroveManager')
    ).address
  );
  if ((await troveManagerContract.owner()) === deployer) {
    const tx = await troveManagerContract.setAddresses(
      borrowerOperationsAddress,
      activePoolAddress,
      defaultPoolAddress,
      stabilityPoolAddress,
      gasPoolAddress,
      collSurplusPoolAddress,
      priceFeedAddress,
      busdcTokenAddress,
      sortedTrovesAddress,
      b2bTokenAddress,
      b2bStakingAddress,
      stableMintControllerAddress
    );
    await tx.wait();
  }

  const StableMintControllerContract = await ethers.getContractAt('StableMintController', (await deployments.get('StableMintController')).address);
  if ((await StableMintControllerContract.owner()) === deployer) {
    // TODO deploy a different BorrowerOperations contract
    const borrowerOperationsAddress2 = stabilityPoolAddress;
    const tx = await StableMintControllerContract.setParams(
      troveManagerAddress,
      stabilityPoolAddress,
      borrowerOperationsAddress,
      borrowerOperationsAddress2,
      ethers.utils.parseEther('100'),
      ethers.utils.parseEther('100'),
    );
    await tx.wait();
  }
};

export default deployFunction;

deployFunction.dependencies = ['ActivePool', 'StabilityPool', 'BorrowerOperations', 'TroveManager', 'StableMintController'];

deployFunction.tags = ['SetParams'];
