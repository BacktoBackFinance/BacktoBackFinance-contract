import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({ deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { address } = await deploy('LockupContractFactory', { from: deployer });
  console.log('LockupContractFactory deployed at', address);
};

export default deployFunction;

deployFunction.dependencies = [];

deployFunction.tags = ['LockupContractFactory'];
