import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({ deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const backedOracleAddress = (await deployments.get('BackedOracle')).address;
  const { address } = await deploy('BackedOracleProxy', { from: deployer, args: [backedOracleAddress] });
  console.log('BackedOracleProxy deployed at', address);
};

export default deployFunction;

deployFunction.dependencies = ['BackedOracle'];

deployFunction.tags = ['BackedOracleProxy'];
