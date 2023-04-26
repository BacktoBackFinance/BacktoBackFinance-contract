// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../B2B/B2BStaking.sol";


contract B2BStakingTester is B2BStaking {
    function requireCallerIsTroveManager() external view {
        _requireCallerIsTroveManager();
    }
}
