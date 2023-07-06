import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({
  deployments,
  ethers,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) {
  const { deployer } = await getNamedAccounts();
  const activePoolContract = await ethers.getContractAt('ActivePool', (await deployments.get('ActivePool')).address);
  if ((await activePoolContract.owner()) === deployer) {
    const borrowerOperationsAddress = (await deployments.get('BorrowerOperations')).address;
    const troveManagerAddress = (await deployments.get('TroveManager')).address;
    const stabilityPoolAddress = (await deployments.get('StabilityPool')).address;
    const defaultPoolAddress = (await deployments.get('DefaultPool')).address;
    const backedTokenAddress = (await deployments.get('BackedToken')).address;
    const tx = await activePoolContract.setAddresses(
      borrowerOperationsAddress,
      troveManagerAddress,
      stabilityPoolAddress,
      defaultPoolAddress,
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
    const troveManagerAddress = (await deployments.get('TroveManager')).address;
    const activePoolAddress = (await deployments.get('ActivePool')).address;
    const defaultPoolAddress = (await deployments.get('DefaultPool')).address;
    const stabilityPoolAddress = (await deployments.get('StabilityPool')).address;
    const gasPoolAddress = (await deployments.get('GasPool')).address;
    const collSurplusPoolAddress = (await deployments.get('CollSurplusPool')).address;
    const priceFeedAddress = (await deployments.get('BackedOracleProxy')).address;
    const sortedTrovesAddress = (await deployments.get('SortedTroves')).address;
    const busdcTokenAddress = (await deployments.get('BUSDCToken')).address;
    const b2bStakingAddress = (await deployments.get('B2BStaking')).address;
    const backedTokenAddress = (await deployments.get('BackedToken')).address;
    const stableMintControllerAddress = (await deployments.get('StableMintController')).address;
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

  const troveManagerContract = await ethers.getContractAt(
    'TroveManager',
    (
      await deployments.get('TroveManager')
    ).address
  );
  if ((await troveManagerContract.owner()) === deployer) {
    const borrowerOperationsAddress = (await deployments.get('BorrowerOperations')).address;
    const activePoolAddress = (await deployments.get('ActivePool')).address;
    const defaultPoolAddress = (await deployments.get('DefaultPool')).address;
    const stabilityPoolAddress = (await deployments.get('StabilityPool')).address;
    const gasPoolAddress = (await deployments.get('GasPool')).address;
    const collSurplusPoolAddress = (await deployments.get('CollSurplusPool')).address;
    const priceFeedAddress = (await deployments.get('BackedOracleProxy')).address;
    const busdcTokenAddress = (await deployments.get('BUSDCToken')).address;
    const sortedTrovesAddress = (await deployments.get('SortedTroves')).address;
    const b2bTokenAddress = (await deployments.get('B2BToken')).address;
    const b2bStakingAddress = (await deployments.get('B2BStaking')).address;
    const stableMintControllerAddress = (await deployments.get('StableMintController')).address;
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

  const stabilityPoolContract = await ethers.getContractAt(
    'StabilityPool',
    (
      await deployments.get('StabilityPool')
    ).address
  );
  if ((await stabilityPoolContract.owner()) === deployer) {
    const borrowerOperationsAddress = (await deployments.get('BorrowerOperations')).address;
    const troveManagerAddress = (await deployments.get('TroveManager')).address;
    const activePoolAddress = (await deployments.get('ActivePool')).address;
    const busdcTokenAddress = (await deployments.get('BUSDCToken')).address;
    const sortedTrovesAddress = (await deployments.get('SortedTroves')).address;
    const priceFeedAddress = (await deployments.get('BackedOracleProxy')).address;
    const communityIssuanceAddress = (await deployments.get('CommunityIssuance')).address;
    const backedTokenAddress = (await deployments.get('BackedToken')).address;
    const stableMintControllerAddress = (await deployments.get('StableMintController')).address;
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

  const communityIssuanceContract = await ethers.getContractAt(
    'CommunityIssuance',
    (
      await deployments.get('CommunityIssuance')
    ).address
  );
  if ((await communityIssuanceContract.owner()) === deployer) {
    const b2bTokenAddress = (await deployments.get('B2BToken')).address;
    const stabilityPoolAddress = (await deployments.get('StabilityPool')).address;
    const tx = await communityIssuanceContract.setAddresses(b2bTokenAddress, stabilityPoolAddress);
    await tx.wait();
  }

  const lockupContractFactoryContract = await ethers.getContractAt(
    'LockupContractFactory',
    (
      await deployments.get('LockupContractFactory')
    ).address
  );
  if ((await lockupContractFactoryContract.owner()) === deployer) {
    const b2bTokenAddress = (await deployments.get('B2BToken')).address;
    const tx = await lockupContractFactoryContract.setB2BTokenAddress(b2bTokenAddress);
    await tx.wait();
  }

  const B2BStakingContract = await ethers.getContractAt('B2BStaking', (await deployments.get('B2BStaking')).address);
  if ((await B2BStakingContract.owner()) === deployer) {
    const b2bTokenAddress = (await deployments.get('B2BToken')).address;
    const busdcTokenAddress = (await deployments.get('BUSDCToken')).address;
    const troveManagerAddress = (await deployments.get('TroveManager')).address;
    const borrowerOperationsAddress = (await deployments.get('BorrowerOperations')).address;
    const activePoolAddress = (await deployments.get('ActivePool')).address;
    const backedTokenAddress = (await deployments.get('BackedToken')).address;
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

  const StableMintControllerContract = await ethers.getContractAt('StableMintController', (await deployments.get('StableMintController')).address);
  if ((await StableMintControllerContract.owner()) === deployer) {
    const troveManagerAddress = (await deployments.get('TroveManager')).address;
    const stabilityPoolAddress = (await deployments.get('StabilityPool')).address;
    const borrowerOperationsAddress = (await deployments.get('BorrowerOperations')).address;
    // TODO deploy a different BorrowerOperations contract
    const borrowerOperationsAddress2 = stabilityPoolAddress;
    const tx = await StableMintControllerContract.setAddresses(
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

deployFunction.tags = ['SetAddress'];
