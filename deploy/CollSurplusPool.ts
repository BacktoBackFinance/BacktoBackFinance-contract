import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({
  deployments,
  ethers,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { address } = await deploy('CollSurplusPool', { from: deployer });
  console.log('CollSurplusPool deployed at', address);

  const contract = await ethers.getContractAt('CollSurplusPool', (await deployments.get('CollSurplusPool')).address);
  if ((await contract.owner()) === deployer) {
    const borrowerOperationsAddress = (await deployments.get('BorrowerOperations')).address;
    const troveManagerAddress = (await deployments.get('TroveManager')).address;
    const activePoolAddress = (await deployments.get('ActivePool')).address;
    const backedTokenAddress = (await deployments.get('BackedToken')).address;
    const tx = await contract.setAddresses(
      borrowerOperationsAddress,
      troveManagerAddress,
      activePoolAddress,
      backedTokenAddress
    );
    await tx.wait();
  }
};

export default deployFunction;

deployFunction.dependencies = ['BorrowerOperations', 'TroveManager', 'ActivePool'];

deployFunction.tags = ['CollSurplusPool'];
