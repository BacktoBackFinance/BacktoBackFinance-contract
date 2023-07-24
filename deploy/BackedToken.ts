import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({ deployments, ethers, getNamedAccounts }: HardhatRuntimeEnvironment) {
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

  const backedToken = await ethers.getContractAt('BackedTokenImplementation', address);
  if (await backedToken.minter() === ethers.constants.AddressZero) {
    const tx = await backedToken.setMinter(deployer);
    await tx.wait();
  }
  if (await backedToken.sanctionsList() === ethers.constants.AddressZero) {
    const tx = await backedToken.setSanctionsList((await deployments.get('SanctionsListMock')).address);
    await tx.wait();
  }
};

export default deployFunction;

deployFunction.dependencies = ['SanctionsListMock'];

deployFunction.tags = ['BackedToken'];
