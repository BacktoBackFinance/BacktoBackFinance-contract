import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({ deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const troveManagerAddress = (await deployments.get('TroveManager')).address;
  const stabilityPoolAddress = (await deployments.get('StabilityPool')).address;
  const borrowerOperationsAddress = (await deployments.get('BorrowerOperations')).address;
  const { address } = await deploy('BUSDCToken', {
    from: deployer,
    args: [troveManagerAddress, stabilityPoolAddress, borrowerOperationsAddress],
  });
  console.log('BUSDCToken deployed at', address);
};

export default deployFunction;

deployFunction.dependencies = ['TroveManager', 'StabilityPool', 'BorrowerOperations'];

deployFunction.tags = ['BUSDCToken'];
