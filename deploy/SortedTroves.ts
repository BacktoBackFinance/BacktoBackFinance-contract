import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({
  deployments,
  ethers,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { address } = await deploy('SortedTroves', { from: deployer });
  console.log('SortedTroves deployed at', address);

  const contract = await ethers.getContractAt('SortedTroves', (await deployments.get('SortedTroves')).address);
  if ((await contract.owner()) === deployer) {
    const size = ethers.constants.MaxUint256;
    const troveManagerAddress = (await deployments.get('TroveManager')).address;
    const borrowerOperationsAddress = (await deployments.get('BorrowerOperations')).address;
    const tx = await contract.setParams(size, troveManagerAddress, borrowerOperationsAddress);
    await tx.wait();
  }
};

export default deployFunction;

deployFunction.dependencies = ['TroveManager', 'BorrowerOperations'];

deployFunction.tags = ['SortedTroves'];
