// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Dependencies/BaseMath.sol";
import "../Dependencies/SafeMath.sol";
import "../Dependencies/Ownable.sol";
import "../Dependencies/CheckContract.sol";
import "../Dependencies/console.sol";
import "../Interfaces/IB2BToken.sol";
import "../Interfaces/IB2BStaking.sol";
import "../Dependencies/LiquityMath.sol";
import "../Interfaces/IBUSDCToken.sol";

contract B2BStaking is IB2BStaking, Ownable, CheckContract, BaseMath {
    using SafeMath for uint;

    // --- Data ---
    string constant public NAME = "B2BStaking";

    mapping( address => uint) public stakes;
    uint public totalB2BStaked;

    uint public F_ETH;  // Running sum of ETH fees per-B2B-staked
    uint public F_BUSDC; // Running sum of B2B fees per-B2B-staked

    // User snapshots of F_ETH and F_BUSDC, taken at the point at which their latest deposit was made
    mapping (address => Snapshot) public snapshots;

    struct Snapshot {
        uint F_ETH_Snapshot;
        uint F_BUSDC_Snapshot;
    }

    IB2BToken public b2bToken;
    IBUSDCToken public busdcToken;

    address public troveManagerAddress;
    address public borrowerOperationsAddress;
    address public activePoolAddress;

    // --- Events ---

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
        address _activePoolAddress
    )
        external
        onlyOwner
        override
    {
        checkContract(_b2bTokenAddress);
        checkContract(_busdcTokenAddress);
        checkContract(_troveManagerAddress);
        checkContract(_borrowerOperationsAddress);
        checkContract(_activePoolAddress);

        b2bToken = IB2BToken(_b2bTokenAddress);
        busdcToken = IBUSDCToken(_busdcTokenAddress);
        troveManagerAddress = _troveManagerAddress;
        borrowerOperationsAddress = _borrowerOperationsAddress;
        activePoolAddress = _activePoolAddress;

        emit B2BTokenAddressSet(_b2bTokenAddress);
        emit B2BTokenAddressSet(_busdcTokenAddress);
        emit TroveManagerAddressSet(_troveManagerAddress);
        emit BorrowerOperationsAddressSet(_borrowerOperationsAddress);
        emit ActivePoolAddressSet(_activePoolAddress);

        _renounceOwnership();
    }

    // If caller has a pre-existing stake, send any accumulated ETH and BUSDC gains to them.
    function stake(uint _B2Bamount) external override {
        _requireNonZeroAmount(_B2Bamount);

        uint currentStake = stakes[msg.sender];

        uint ETHGain;
        uint BUSDCGain;
        // Grab any accumulated ETH and BUSDC gains from the current stake
        if (currentStake != 0) {
            ETHGain = _getPendingETHGain(msg.sender);
            BUSDCGain = _getPendingBUSDCGain(msg.sender);
        }

       _updateUserSnapshots(msg.sender);

        uint newStake = currentStake.add(_B2Bamount);

        // Increase user’s stake and total B2B staked
        stakes[msg.sender] = newStake;
        totalB2BStaked = totalB2BStaked.add(_B2Bamount);
        emit TotalB2BStakedUpdated(totalB2BStaked);

        // Transfer B2B from caller to this contract
        b2bToken.sendToB2BStaking(msg.sender, _B2Bamount);

        emit StakeChanged(msg.sender, newStake);
        emit StakingGainsWithdrawn(msg.sender, BUSDCGain, ETHGain);

         // Send accumulated BUSDC and ETH gains to the caller
        if (currentStake != 0) {
            busdcToken.transfer(msg.sender, BUSDCGain);
            _sendETHGainToUser(ETHGain);
        }
    }

    // Unstake the B2B and send the it back to the caller, along with their accumulated BUSDC & ETH gains.
    // If requested amount > stake, send their entire stake.
    function unstake(uint _B2Bamount) external override {
        uint currentStake = stakes[msg.sender];
        _requireUserHasStake(currentStake);

        // Grab any accumulated ETH and BUSDC gains from the current stake
        uint ETHGain = _getPendingETHGain(msg.sender);
        uint BUSDCGain = _getPendingBUSDCGain(msg.sender);

        _updateUserSnapshots(msg.sender);

        if (_B2Bamount > 0) {
            uint B2BToWithdraw = LiquityMath._min(_B2Bamount, currentStake);

            uint newStake = currentStake.sub(B2BToWithdraw);

            // Decrease user's stake and total B2B staked
            stakes[msg.sender] = newStake;
            totalB2BStaked = totalB2BStaked.sub(B2BToWithdraw);
            emit TotalB2BStakedUpdated(totalB2BStaked);

            // Transfer unstaked B2B to user
            b2bToken.transfer(msg.sender, B2BToWithdraw);

            emit StakeChanged(msg.sender, newStake);
        }

        emit StakingGainsWithdrawn(msg.sender, BUSDCGain, ETHGain);

        // Send accumulated BUSDC and ETH gains to the caller
        busdcToken.transfer(msg.sender, BUSDCGain);
        _sendETHGainToUser(ETHGain);
    }

    // --- Reward-per-unit-staked increase functions. Called by Liquity core contracts ---

    function increaseF_ETH(uint _ETHFee) external override {
        _requireCallerIsTroveManager();
        uint ETHFeePerB2BStaked;

        if (totalB2BStaked > 0) {ETHFeePerB2BStaked = _ETHFee.mul(DECIMAL_PRECISION).div(totalB2BStaked);}

        F_ETH = F_ETH.add(ETHFeePerB2BStaked);
        emit F_ETHUpdated(F_ETH);
    }

    function increaseF_BUSDC(uint _BUSDCFee) external override {
        _requireCallerIsBorrowerOperations();
        uint BUSDCFeePerB2BStaked;

        if (totalB2BStaked > 0) {BUSDCFeePerB2BStaked = _BUSDCFee.mul(DECIMAL_PRECISION).div(totalB2BStaked);}

        F_BUSDC = F_BUSDC.add(BUSDCFeePerB2BStaked);
        emit F_BUSDCUpdated(F_BUSDC);
    }

    // --- Pending reward functions ---

    function getPendingETHGain(address _user) external view override returns (uint) {
        return _getPendingETHGain(_user);
    }

    function _getPendingETHGain(address _user) internal view returns (uint) {
        uint F_ETH_Snapshot = snapshots[_user].F_ETH_Snapshot;
        uint ETHGain = stakes[_user].mul(F_ETH.sub(F_ETH_Snapshot)).div(DECIMAL_PRECISION);
        return ETHGain;
    }

    function getPendingBUSDCGain(address _user) external view override returns (uint) {
        return _getPendingBUSDCGain(_user);
    }

    function _getPendingBUSDCGain(address _user) internal view returns (uint) {
        uint F_BUSDC_Snapshot = snapshots[_user].F_BUSDC_Snapshot;
        uint BUSDCGain = stakes[_user].mul(F_BUSDC.sub(F_BUSDC_Snapshot)).div(DECIMAL_PRECISION);
        return BUSDCGain;
    }

    // --- Internal helper functions ---

    function _updateUserSnapshots(address _user) internal {
        snapshots[_user].F_ETH_Snapshot = F_ETH;
        snapshots[_user].F_BUSDC_Snapshot = F_BUSDC;
        emit StakerSnapshotsUpdated(_user, F_ETH, F_BUSDC);
    }

    function _sendETHGainToUser(uint ETHGain) internal {
        emit EtherSent(msg.sender, ETHGain);
        (bool success, ) = msg.sender.call{value: ETHGain}("");
        require(success, "B2BStaking: Failed to send accumulated ETHGain");
    }

    // --- 'require' functions ---

    function _requireCallerIsTroveManager() internal view {
        require(msg.sender == troveManagerAddress, "B2BStaking: caller is not TroveM");
    }

    function _requireCallerIsBorrowerOperations() internal view {
        require(msg.sender == borrowerOperationsAddress, "B2BStaking: caller is not BorrowerOps");
    }

     function _requireCallerIsActivePool() internal view {
        require(msg.sender == activePoolAddress, "B2BStaking: caller is not ActivePool");
    }

    function _requireUserHasStake(uint currentStake) internal pure {
        require(currentStake > 0, 'B2BStaking: User must have a non-zero stake');
    }

    function _requireNonZeroAmount(uint _amount) internal pure {
        require(_amount > 0, 'B2BStaking: Amount must be non-zero');
    }

    receive() external payable {
        _requireCallerIsActivePool();
    }
}
