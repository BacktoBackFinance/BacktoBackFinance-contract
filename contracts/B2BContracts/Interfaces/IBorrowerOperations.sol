// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

// Common interface for the Trove Manager.
interface IBorrowerOperations {
    // --- Events ---

    event TroveManagerAddressChanged(address _newTroveManagerAddress);
    event ActivePoolAddressChanged(address _activePoolAddress);
    event DefaultPoolAddressChanged(address _defaultPoolAddress);
    event StabilityPoolAddressChanged(address _stabilityPoolAddress);
    event GasPoolAddressChanged(address _gasPoolAddress);
    event CollSurplusPoolAddressChanged(address _collSurplusPoolAddress);
    event PriceFeedAddressChanged(address _newPriceFeedAddress);
    event SortedTrovesAddressChanged(address _sortedTrovesAddress);
    event BUSDCTokenAddressChanged(address _busdcTokenAddress);
    event B2BStakingAddressChanged(address _b2bStakingAddress);

    event TroveCreated(address indexed _borrower, uint arrayIndex);
    event TroveUpdated(address indexed _borrower, uint _debt, uint _coll, uint stake, uint8 operation);
    event BUSDCBorrowingFeePaid(address indexed _borrower, uint _BUSDCFee);

    // --- Functions ---

    function setAddresses(
        address _troveManagerAddress,
        address _activePoolAddress,
        address _defaultPoolAddress,
        address _stabilityPoolAddress,
        address _gasPoolAddress,
        address _collSurplusPoolAddress,
        address _priceFeedAddress,
        address _sortedTrovesAddress,
        address _busdcTokenAddress,
        address _b2bStakingAddress,
        address _backedTokenAddress,
        address _stableMintControllerAddress
    ) external;

    function openTrove(
        uint _maxFee,
        uint _BUSDCamount,
        address _upperHint,
        address _lowerHint,
        uint _backedAmount
    ) external;

    function addColl(address _upperHint, address _lowerHint, uint _backedAmount) external;

    function moveETHGainToTrove(address _user, address _upperHint, address _lowerHint, uint _backedAmount) external;

    function withdrawColl(uint _amount, address _upperHint, address _lowerHint) external;

    function withdrawBUSDC(
        uint _maxFee,
        uint _amount,
        address _upperHint,
        address _lowerHint
    ) external;

    function repayBUSDC(uint _amount, address _upperHint, address _lowerHint) external;

    function closeTrove() external;

    function adjustTrove(
        uint _maxFee,
        uint _collWithdrawal,
        uint _debtChange,
        bool isDebtIncrease,
        address _upperHint,
        address _lowerHint,
        uint _backedAmount
    ) external;

    function claimCollateral() external;

    function getCompositeDebt(uint _debt) external pure returns (uint);
}
