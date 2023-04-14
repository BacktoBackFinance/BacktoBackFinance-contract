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
  const oracle = (await deployments.get('BackedOracle')).address;
  const backedVault = (await deployments.get('BackedVault')).address;
  const { address } = await deploy('BackedSwap', {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: 'initialize',
          args: [stableToken, backedToken, oracle, backedVault],
        },
      },
    },
  });
  console.log('BackedSwap deployed at', address);
};

export default deployFunction;

deployFunction.dependencies = ['BackedToken', 'BackedOracle', 'BackedVault', 'MockUSDC'];

deployFunction.tags = ['BackedSwap'];
