import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({
    deployments,
    ethers,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const { address } = await deploy('ActivePool', { from: deployer });
    console.log('ActivePool deployed at', address);

    const contract = await ethers.getContractAt('ActivePool', (await deployments.get('ActivePool')).address);
    if ((await contract.owner()) === deployer) {
        const borrowerOperationsAddress = (await deployments.get('BorrowerOperations')).address;
        const troveManagerAddress = (await deployments.get('TroveManager')).address;
        const stabilityPoolAddress = (await deployments.get('StabilityPool')).address;
        const defaultPoolAddress = (await deployments.get('DefaultPool')).address;
        const tx = await contract.setAddresses(
            borrowerOperationsAddress,
            troveManagerAddress,
            stabilityPoolAddress,
            defaultPoolAddress
        );
        await tx.wait();
    }
};

export default deployFunction;

deployFunction.dependencies = ['BorrowerOperations', 'TroveManager', 'StabilityPool', 'DefaultPool'];

deployFunction.tags = ['ActivePool'];
