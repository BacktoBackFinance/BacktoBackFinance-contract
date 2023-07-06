// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

interface IB2BStaking {

    // --- Events --

    event B2BTokenAddressSet(address _b2bTokenAddress);
    event BUSDCTokenAddressSet(address _busdcTokenAddress);
    event TroveManagerAddressSet(address _troveManager);
    event BorrowerOperationsAddressSet(address _borrowerOperationsAddress);
    event ActivePoolAddressSet(address _activePoolAddress);

    event StakeChanged(address indexed staker, uint newStake);
    event StakingGainsWithdrawn(address indexed staker, uint BUSDCGain, uint ETHGain);
    event F_ETHUpdated(uint _F_ETH);
    event F_BUSDCUpdated(uint _F_BUSDC);
    event TotalB2BStakedUpdated(uint _totalB2BStaked);
    event EtherSent(address _account, uint _amount);
    event StakerSnapshotsUpdated(address _staker, uint _F_ETH, uint _F_BUSDC);

    // --- Functions ---

    function setAddresses
    (
        address _b2bTokenAddress,
        address _busdcTokenAddress,
        address _troveManagerAddress,
        address _borrowerOperationsAddress,
        address _activePoolAddress,
        address _backedTokenAddress
    )  external;

    function stake(uint _B2Bamount) external;

    function unstake(uint _B2Bamount) external;

    function increaseF_ETH(uint _ETHFee) external;

    function increaseF_BUSDC(uint _B2BFee) external;

    function getPendingETHGain(address _user) external view returns (uint);

    function getPendingBUSDCGain(address _user) external view returns (uint);
}
