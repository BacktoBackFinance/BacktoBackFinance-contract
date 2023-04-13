import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({
  deployments,
  ethers,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { address } = await deploy('StabilityPool', { from: deployer });
  console.log('StabilityPool deployed at', address);

  // const contract = await ethers.getContractAt('StabilityPool', (await deployments.get('StabilityPool')).address);
  // if ((await contract.owner()) === deployer) {
  //   const borrowerOperationsAddress = (await deployments.get('BorrowerOperations')).address;
  //   const troveManagerAddress = (await deployments.get('TroveManager')).address;
  //   const activePoolAddress = (await deployments.get('ActivePool')).address;
  //   const lusdTokenAddress = (await deployments.get('LUSDToken')).address;
  //   const sortedTrovesAddress = (await deployments.get('SortedTroves')).address;
  //   const priceFeedAddress = (await deployments.get('BackedOracle')).address;
  //   const communityIssuanceAddress = (await deployments.get('CommunityIssuance')).address;
  //   const tx = await contract.setAddresses(
  //     borrowerOperationsAddress,
  //     troveManagerAddress,
  //     activePoolAddress,
  //     lusdTokenAddress,
  //     sortedTrovesAddress,
  //     priceFeedAddress,
  //     communityIssuanceAddress
  //   );
  //   await tx.wait();
  // }
};

export default deployFunction;

// deployFunction.dependencies = [
//   'BorrowerOperations',
//   'TroveManager',
//   'ActivePool',
//   'LUSDToken',
//   'SortedTroves',
//   'BackedOracle',
//   'CommunityIssuance',
// ];

deployFunction.tags = ['StabilityPool'];
