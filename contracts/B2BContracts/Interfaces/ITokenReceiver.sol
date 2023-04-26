// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

interface ITokenReceiver {
    // --- Functions ---
    function receiveBackedToken(uint256 amount) external;
}
