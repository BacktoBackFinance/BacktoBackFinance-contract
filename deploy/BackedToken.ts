import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({ deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const name = 'Backed IB01 $ Treasury Bond 0-1yr';
  const symbol = 'bIB01';
  const { address } = await deploy('BackedToken', {
    contract: 'BackedTokenImplementation',
    from: deployer,
    log: true,
    deterministicDeployment: false,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: 'initialize',
          args: [name, symbol],
        },
      },
    },
  });
  console.log('BackedToken deployed at', address);
};

export default deployFunction;

deployFunction.dependencies = [];

deployFunction.tags = ['BackedToken'];
