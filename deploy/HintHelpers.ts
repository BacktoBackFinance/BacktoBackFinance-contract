import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({
  deployments,
  ethers,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { address } = await deploy('HintHelpers', { from: deployer });
  console.log('HintHelpers deployed at', address);

  const contract = await ethers.getContractAt('HintHelpers', (await deployments.get('HintHelpers')).address);
  if ((await contract.owner()) === deployer) {
    const sortedTrovesAddress = (await deployments.get('SortedTroves')).address;
    const troveManagerAddress = (await deployments.get('TroveManager')).address;
    const tx = await contract.setAddresses(sortedTrovesAddress, troveManagerAddress);
    await tx.wait();
  }
};

export default deployFunction;

deployFunction.dependencies = ['SortedTroves', 'TroveManager'];

deployFunction.tags = ['HintHelpers'];
