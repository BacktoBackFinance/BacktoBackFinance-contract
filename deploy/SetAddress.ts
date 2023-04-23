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
    const lqtyStakingAddress = (await deployments.get('LQTYStaking')).address;
    const backedTokenAddress = (await deployments.get('BackedToken')).address;
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
      lqtyStakingAddress,
      backedTokenAddress
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
    const lqtyTokenAddress = (await deployments.get('LQTYToken')).address;
    const lqtyStakingAddress = (await deployments.get('LQTYStaking')).address;
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
      lqtyTokenAddress,
      lqtyStakingAddress
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
    const tx = await stabilityPoolContract.setAddresses(
      borrowerOperationsAddress,
      troveManagerAddress,
      activePoolAddress,
      busdcTokenAddress,
      sortedTrovesAddress,
      priceFeedAddress,
      communityIssuanceAddress,
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
    const lqtyTokenAddress = (await deployments.get('LQTYToken')).address;
    const stabilityPoolAddress = (await deployments.get('StabilityPool')).address;
    const tx = await communityIssuanceContract.setAddresses(lqtyTokenAddress, stabilityPoolAddress);
    await tx.wait();
  }

  const lockupContractFactoryContract = await ethers.getContractAt(
    'LockupContractFactory',
    (
      await deployments.get('LockupContractFactory')
    ).address
  );
  if ((await lockupContractFactoryContract.owner()) === deployer) {
    const lqtyTokenAddress = (await deployments.get('LQTYToken')).address;
    const tx = await lockupContractFactoryContract.setLQTYTokenAddress(lqtyTokenAddress);
    await tx.wait();
  }

  const LQTYStakingContract = await ethers.getContractAt('LQTYStaking', (await deployments.get('LQTYStaking')).address);
  if ((await LQTYStakingContract.owner()) === deployer) {
    const lqtyTokenAddress = (await deployments.get('LQTYToken')).address;
    const busdcTokenAddress = (await deployments.get('BUSDCToken')).address;
    const troveManagerAddress = (await deployments.get('TroveManager')).address;
    const borrowerOperationsAddress = (await deployments.get('BorrowerOperations')).address;
    const activePoolAddress = (await deployments.get('ActivePool')).address;
    const tx = await LQTYStakingContract.setAddresses(
      lqtyTokenAddress,
      busdcTokenAddress,
      troveManagerAddress,
      borrowerOperationsAddress,
      activePoolAddress
    );
    await tx.wait();
  }
};

export default deployFunction;

deployFunction.dependencies = ['ActivePool', 'StabilityPool', 'BorrowerOperations', 'TroveManager'];

deployFunction.tags = ['SetAddress'];
