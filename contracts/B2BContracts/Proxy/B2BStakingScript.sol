// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Dependencies/CheckContract.sol";
import "../Interfaces/IB2BStaking.sol";


contract B2BStakingScript is CheckContract {
    IB2BStaking immutable B2BStaking;

    constructor(address _b2bStakingAddress) public {
        checkContract(_b2bStakingAddress);
        B2BStaking = IB2BStaking(_b2bStakingAddress);
    }

    function stake(uint _B2Bamount) external {
        B2BStaking.stake(_B2Bamount);
    }
}
