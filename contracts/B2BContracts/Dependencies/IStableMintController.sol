// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

interface IStableMintController {
    function setAddresses(
        address _troveManagerAddress,
        address _stabilityPoolAddress,
        address _ethBoAddress,
        address _backedBoAddress,
        uint256 _initMintCapsOfEthBO,
        uint256 _initMintCapsOfBackedBO
    ) external;

    function increaseMint(address borrowerOperations, uint256 amount) external;

    function decreaseMint(address borrowerOperations, uint256 amount) external;

    function availableAmount(address borrowerOperations) external view returns (uint256);
}
