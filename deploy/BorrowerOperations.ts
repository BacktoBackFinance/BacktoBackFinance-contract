import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({ deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { address } = await deploy('BorrowerOperations', { from: deployer });
  console.log('BorrowerOperations deployed at', address);
};

export default deployFunction;

deployFunction.dependencies = [];

deployFunction.tags = ['BorrowerOperations'];
