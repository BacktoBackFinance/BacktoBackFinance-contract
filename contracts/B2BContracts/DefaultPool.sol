// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "./Interfaces/IDefaultPool.sol";
import "./Interfaces/ITokenReceiver.sol";
import "./Dependencies/SafeMath.sol";
import "./Dependencies/Ownable.sol";
import "./Dependencies/CheckContract.sol";
import "./Dependencies/console.sol";
import "./Dependencies/IERC20.sol";

/*
 * The Default Pool holds the ETH and BUSDC debt (but not BUSDC tokens) from liquidations that have been redistributed
 * to active troves but not yet "applied", i.e. not yet recorded on a recipient active trove's struct.
 *
 * When a trove makes an operation that applies its pending ETH and BUSDC debt, its pending ETH and BUSDC debt is moved
 * from the Default Pool to the Active Pool.
 */
contract DefaultPool is Ownable, CheckContract, IDefaultPool {
    using SafeMath for uint256;

    string public constant NAME = "DefaultPool";

    address public troveManagerAddress;
    address public activePoolAddress;
    address public backedTokenAddress;
    uint256 internal ETH; // deposited ETH tracker
    uint256 internal BUSDCDebt; // debt

    event TroveManagerAddressChanged(address _newTroveManagerAddress);
    event DefaultPoolBUSDCDebtUpdated(uint _BUSDCDebt);
    event DefaultPoolETHBalanceUpdated(uint _ETH);

    // --- Dependency setters ---

    function setAddresses(
        address _troveManagerAddress,
        address _activePoolAddress,
        address _backedTokenAddress
    ) external onlyOwner {
        checkContract(_troveManagerAddress);
        checkContract(_activePoolAddress);
        checkContract(_backedTokenAddress);

        troveManagerAddress = _troveManagerAddress;
        activePoolAddress = _activePoolAddress;
        backedTokenAddress = _backedTokenAddress;

        emit TroveManagerAddressChanged(_troveManagerAddress);
        emit ActivePoolAddressChanged(_activePoolAddress);

        _renounceOwnership();
    }

    // --- Getters for public variables. Required by IPool interface ---

    /*
     * Returns the ETH state variable.
     *
     * Not necessarily equal to the the contract's raw ETH balance - ether can be forcibly sent to contracts.
     */
    function getETH() external view override returns (uint) {
        return ETH;
    }

    function getBUSDCDebt() external view override returns (uint) {
        return BUSDCDebt;
    }

    // --- Pool functionality ---

    function sendETHToActivePool(uint _amount) external override {
        _requireCallerIsTroveManager();
        address activePool = activePoolAddress; // cache to save an SLOAD
        ETH = ETH.sub(_amount);
        emit DefaultPoolETHBalanceUpdated(ETH);
        emit EtherSent(activePool, _amount);

        IERC20(backedTokenAddress).approve(activePool, _amount);
        ITokenReceiver(activePool).receiveBackedToken(_amount);
    }

    function increaseBUSDCDebt(uint _amount) external override {
        _requireCallerIsTroveManager();
        BUSDCDebt = BUSDCDebt.add(_amount);
        emit DefaultPoolBUSDCDebtUpdated(BUSDCDebt);
    }

    function decreaseBUSDCDebt(uint _amount) external override {
        _requireCallerIsTroveManager();
        BUSDCDebt = BUSDCDebt.sub(_amount);
        emit DefaultPoolBUSDCDebtUpdated(BUSDCDebt);
    }

    // --- 'require' functions ---

    function _requireCallerIsActivePool() internal view {
        require(msg.sender == activePoolAddress, "DefaultPool: Caller is not the ActivePool");
    }

    function _requireCallerIsTroveManager() internal view {
        require(msg.sender == troveManagerAddress, "DefaultPool: Caller is not the TroveManager");
    }

    function receiveBackedToken(uint256 amount) external {
        _requireCallerIsActivePool();
        ETH = ETH.add(amount);
        IERC20(backedTokenAddress).transferFrom(msg.sender, address(this), amount);
        emit DefaultPoolETHBalanceUpdated(ETH);
    }
}
