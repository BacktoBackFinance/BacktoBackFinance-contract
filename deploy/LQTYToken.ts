import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployFunction: DeployFunction = async function ({ deployments, getNamedAccounts }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const communityIssuanceAddress = (await deployments.get('CommunityIssuance')).address;
  const lqtyStakingAddress = (await deployments.get('LQTYStaking')).address;
  const lockupFactoryAddress = (await deployments.get('LockupContractFactory')).address;
  const bountyAddress = '0x0000000000000000000000000000000000000001';
  const lpRewardsAddress = '0x0000000000000000000000000000000000000002';
  const multisigAddress = '0x0000000000000000000000000000000000000003';
  const { address } = await deploy('LQTYToken', {
    from: deployer,
    args: [
      communityIssuanceAddress,
      lqtyStakingAddress,
      lockupFactoryAddress,
      bountyAddress,
      lpRewardsAddress,
      multisigAddress,
    ],
  });
  console.log('LQTYToken deployed at', address);
};

export default deployFunction;

deployFunction.dependencies = ['CommunityIssuance', 'LQTYStaking', 'LockupContractFactory'];

deployFunction.tags = ['LQTYToken'];
