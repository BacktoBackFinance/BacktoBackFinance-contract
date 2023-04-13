import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({ deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const decimals = 18;
  const description = 'BackedOracle';
  const { address } = await deploy('BackedOracle', { from: deployer, args: [decimals, description] });
  console.log('BackedOracle deployed at', address);
};

export default deployFunction;

deployFunction.dependencies = [];

deployFunction.tags = ['BackedOracle'];
