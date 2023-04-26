// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

interface ILockupContractFactory {

    // --- Events ---

    event B2BTokenAddressSet(address _b2bTokenAddress);
    event LockupContractDeployedThroughFactory(address _lockupContractAddress, address _beneficiary, uint _unlockTime, address _deployer);

    // --- Functions ---

    function setB2BTokenAddress(address _b2bTokenAddress) external;

    function deployLockupContract(address _beneficiary, uint _unlockTime) external;

    function isRegisteredLockup(address _addr) external view returns (bool);
}
