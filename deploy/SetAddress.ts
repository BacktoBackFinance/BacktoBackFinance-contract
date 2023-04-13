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
    const tx = await activePoolContract.setAddresses(
      borrowerOperationsAddress,
      troveManagerAddress,
      stabilityPoolAddress,
      defaultPoolAddress
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
    const priceFeedAddress = (await deployments.get('BackedOracle')).address;
    const sortedTrovesAddress = (await deployments.get('SortedTroves')).address;
    const lusdTokenAddress = (await deployments.get('LUSDToken')).address;
    const lqtyStakingAddress = (await deployments.get('LQTYStaking')).address;
    const tx = await borrowerOperationsContract.setAddresses(
      troveManagerAddress,
      activePoolAddress,
      defaultPoolAddress,
      stabilityPoolAddress,
      gasPoolAddress,
      collSurplusPoolAddress,
      priceFeedAddress,
      sortedTrovesAddress,
      lusdTokenAddress,
      lqtyStakingAddress
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
    const priceFeedAddress = (await deployments.get('BackedOracle')).address;
    const lusdTokenAddress = (await deployments.get('LUSDToken')).address;
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
      lusdTokenAddress,
      sortedTrovesAddress,
      lqtyTokenAddress,
      lqtyStakingAddress
    );
    await tx.wait();
  }
};

export default deployFunction;

deployFunction.dependencies = ['ActivePool', 'StabilityPool', 'BorrowerOperations', 'TroveManager'];

deployFunction.tags = ['SetAddress'];
