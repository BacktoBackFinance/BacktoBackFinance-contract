import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({ deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { address } = await deploy('SanctionsListMock', { from: deployer });
  console.log('SanctionsListMock deployed at', address);
};

export default deployFunction;

deployFunction.dependencies = [];

deployFunction.tags = ['SanctionsListMock'];
