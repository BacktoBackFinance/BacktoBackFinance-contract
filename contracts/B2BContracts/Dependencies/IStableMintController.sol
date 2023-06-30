// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

interface IStableMintController {
    function increaseMint(address borrowerOperations, uint256 amount) external;

    function decreaseMint(address borrowerOperations, uint256 amount) external;

    function availableAmount(address borrowerOperations) external view returns (uint256);
}
