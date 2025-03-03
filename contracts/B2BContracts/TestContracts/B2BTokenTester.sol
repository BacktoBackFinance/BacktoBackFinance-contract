// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../B2B/B2BToken.sol";

contract B2BTokenTester is B2BToken {
    constructor
    (
        address _communityIssuanceAddress,
        address _b2bStakingAddress,
        address _lockupFactoryAddress,
        address _bountyAddress,
        address _lpRewardsAddress,
        address _multisigAddress
    )
        public
        B2BToken
    (
        _communityIssuanceAddress,
        _b2bStakingAddress,
        _lockupFactoryAddress,
        _bountyAddress,
        _lpRewardsAddress,
        _multisigAddress
    )
    {}

    function unprotectedMint(address account, uint256 amount) external {
        // No check for the caller here

        _mint(account, amount);
    }

    function unprotectedSendToB2BStaking(address _sender, uint256 _amount) external {
        // No check for the caller here

        if (_isFirstYear()) {_requireSenderIsNotMultisig(_sender);}
        _transfer(_sender, b2bStakingAddress, _amount);
    }

    function callInternalApprove(address owner, address spender, uint256 amount) external returns (bool) {
        _approve(owner, spender, amount);
    }

    function callInternalTransfer(address sender, address recipient, uint256 amount) external returns (bool) {
        _transfer(sender, recipient, amount);
    }

    function getChainId() external pure returns (uint256 chainID) {
        //return _chainID(); // it’s private
        assembly {
            chainID := chainid()
        }
    }
}
