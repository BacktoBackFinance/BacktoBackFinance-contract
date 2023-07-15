import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { address } = await deploy('SortedTroves', { from: deployer });
  console.log('SortedTroves deployed at', address);
};

export default deployFunction;

deployFunction.dependencies = ['TroveManager', 'BorrowerOperations'];

deployFunction.tags = ['SortedTroves'];
