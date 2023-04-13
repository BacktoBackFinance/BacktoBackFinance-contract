import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({
  deployments,
  ethers,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { address } = await deploy('DefaultPool', { from: deployer });
  console.log('DefaultPool deployed at', address);

  const contract = await ethers.getContractAt('DefaultPool', (await deployments.get('DefaultPool')).address);
  if ((await contract.owner()) === deployer) {
    const troveManagerAddress = (await deployments.get('TroveManager')).address;
    const activePoolAddress = (await deployments.get('ActivePool')).address;
    const tx = await contract.setAddresses(troveManagerAddress, activePoolAddress);
    await tx.wait();
  }
};

export default deployFunction;

deployFunction.dependencies = ['TroveManager', 'ActivePool'];

deployFunction.tags = ['DefaultPool'];
