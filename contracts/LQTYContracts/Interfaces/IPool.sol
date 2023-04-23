// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

// Common interface for the Pools.
interface IPool {

    // --- Events ---

    event ETHBalanceUpdated(uint _newBalance);
    event BUSDCBalanceUpdated(uint _newBalance);
    event ActivePoolAddressChanged(address _newActivePoolAddress);
    event DefaultPoolAddressChanged(address _newDefaultPoolAddress);
    event StabilityPoolAddressChanged(address _newStabilityPoolAddress);
    event EtherSent(address _to, uint _amount);

    // --- Functions ---

    function getETH() external view returns (uint);

    function getBUSDCDebt() external view returns (uint);

    function increaseBUSDCDebt(uint _amount) external;

    function decreaseBUSDCDebt(uint _amount) external;
}
