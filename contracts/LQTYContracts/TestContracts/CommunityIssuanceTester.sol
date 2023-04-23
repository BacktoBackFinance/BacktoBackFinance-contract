// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../LQTY/CommunityIssuance.sol";

contract CommunityIssuanceTester is CommunityIssuance {
    function obtainB2B(uint _amount) external {
        b2bToken.transfer(msg.sender, _amount);
    }

    function getCumulativeIssuanceFraction() external view returns (uint) {
       return _getCumulativeIssuanceFraction();
    }

    function unprotectedIssueB2B() external returns (uint) {
        // No checks on caller address

        uint latestTotalB2BIssued = B2BSupplyCap.mul(_getCumulativeIssuanceFraction()).div(DECIMAL_PRECISION);
        uint issuance = latestTotalB2BIssued.sub(totalB2BIssued);

        totalB2BIssued = latestTotalB2BIssued;
        return issuance;
    }
}
