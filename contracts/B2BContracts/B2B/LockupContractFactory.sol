// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Dependencies/CheckContract.sol";
import "../Dependencies/SafeMath.sol";
import "../Dependencies/Ownable.sol";
import "../Interfaces/ILockupContractFactory.sol";
import "./LockupContract.sol";
import "../Dependencies/console.sol";

/*
* The LockupContractFactory deploys LockupContracts - its main purpose is to keep a registry of valid deployed
* LockupContracts.
*
* This registry is checked by B2BToken when the Liquity deployer attempts to transfer B2B tokens. During the first year
* since system deployment, the Liquity deployer is only allowed to transfer B2B to valid LockupContracts that have been
* deployed by and recorded in the LockupContractFactory. This ensures the deployer's B2B can't be traded or staked in the
* first year, and can only be sent to a verified LockupContract which unlocks at least one year after system deployment.
*
* LockupContracts can of course be deployed directly, but only those deployed through and recorded in the LockupContractFactory
* will be considered "valid" by B2BToken. This is a convenient way to verify that the target address is a genuine
* LockupContract.
*/

contract LockupContractFactory is ILockupContractFactory, Ownable, CheckContract {
    using SafeMath for uint;

    // --- Data ---
    string constant public NAME = "LockupContractFactory";

    uint constant public SECONDS_IN_ONE_YEAR = 31536000;

    address public b2bTokenAddress;

    mapping (address => address) public lockupContractToDeployer;

    // --- Events ---

    event B2BTokenAddressSet(address _b2bTokenAddress);
    event LockupContractDeployedThroughFactory(address _lockupContractAddress, address _beneficiary, uint _unlockTime, address _deployer);

    // --- Functions ---

    function setB2BTokenAddress(address _b2bTokenAddress) external override onlyOwner {
        checkContract(_b2bTokenAddress);

        b2bTokenAddress = _b2bTokenAddress;
        emit B2BTokenAddressSet(_b2bTokenAddress);

        _renounceOwnership();
    }

    function deployLockupContract(address _beneficiary, uint _unlockTime) external override {
        address b2bTokenAddressCached = b2bTokenAddress;
        _requireB2BAddressIsSet(b2bTokenAddressCached);
        LockupContract lockupContract = new LockupContract(
                                                        b2bTokenAddressCached,
                                                        _beneficiary,
                                                        _unlockTime);

        lockupContractToDeployer[address(lockupContract)] = msg.sender;
        emit LockupContractDeployedThroughFactory(address(lockupContract), _beneficiary, _unlockTime, msg.sender);
    }

    function isRegisteredLockup(address _contractAddress) public view override returns (bool) {
        return lockupContractToDeployer[_contractAddress] != address(0);
    }

    // --- 'require'  functions ---
    function _requireB2BAddressIsSet(address _b2bTokenAddress) internal pure {
        require(_b2bTokenAddress != address(0), "LCF: B2B Address is not set");
    }
}
