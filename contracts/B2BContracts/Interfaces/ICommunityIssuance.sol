// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

interface ICommunityIssuance {

    // --- Events ---

    event B2BTokenAddressSet(address _b2bTokenAddress);
    event StabilityPoolAddressSet(address _stabilityPoolAddress);
    event TotalB2BIssuedUpdated(uint _totalB2BIssued);

    // --- Functions ---

    function setAddresses(address _b2bTokenAddress, address _stabilityPoolAddress) external;

    function issueB2B() external returns (uint);

    function sendB2B(address _account, uint _B2Bamount) external;
}
