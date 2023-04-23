import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({ deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const communityIssuanceAddress = (await deployments.get('CommunityIssuance')).address;
  const b2bStakingAddress = (await deployments.get('B2BStaking')).address;
  const lockupFactoryAddress = (await deployments.get('LockupContractFactory')).address;
  const bountyAddress = '0x0000000000000000000000000000000000000001';
  const lpRewardsAddress = '0x0000000000000000000000000000000000000002';
  const multisigAddress = '0x0000000000000000000000000000000000000003';
  const { address } = await deploy('B2BToken', {
    from: deployer,
    args: [
      communityIssuanceAddress,
      b2bStakingAddress,
      lockupFactoryAddress,
      bountyAddress,
      lpRewardsAddress,
      multisigAddress,
    ],
  });
  console.log('B2BToken deployed at', address);
};

export default deployFunction;

deployFunction.dependencies = ['CommunityIssuance', 'B2BStaking', 'LockupContractFactory'];

deployFunction.tags = ['B2BToken'];
