import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { BACKED_TOKEN_ADDRESS, CHAINID, USDC_ADDRESS } from '../constants/constants';

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId as CHAINID;
  const stableToken = USDC_ADDRESS[chainId] || (await deployments.get('MockUSDC')).address;
  const backedToken = BACKED_TOKEN_ADDRESS[chainId] || (await deployments.get('BackedToken')).address;
  const receiver = deployer;
  const oracle = (await deployments.get('BackedOracle')).address;
  const { address } = await deploy('BackedPool', {
    from: deployer,
    args: [stableToken, backedToken, oracle, receiver],
  });
  console.log('BackedPool deployed at', address);
};

export default deployFunction;

deployFunction.dependencies = ['BackedToken', 'MockUSDC'];

deployFunction.tags = ['BackedPool'];
