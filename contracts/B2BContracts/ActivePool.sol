// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "./Interfaces/IActivePool.sol";
import "./Interfaces/ITokenReceiver.sol";
import "./Dependencies/Address.sol";
import "./Dependencies/SafeMath.sol";
import "./Dependencies/Ownable.sol";
import "./Dependencies/CheckContract.sol";
import "./Dependencies/console.sol";
import "./Dependencies/IERC20.sol";

/*
 * The Active Pool holds the ETH collateral and BUSDC debt (but not BUSDC tokens) for all active troves.
 *
 * When a trove is liquidated, it's ETH and BUSDC debt are transferred from the Active Pool, to either the
 * Stability Pool, the Default Pool, or both, depending on the liquidation conditions.
 *
 */
contract ActivePool is Ownable, CheckContract, IActivePool {
    using SafeMath for uint256;

    string public constant NAME = "ActivePool";

    address public borrowerOperationsAddress;
    address public troveManagerAddress;
    address public stabilityPoolAddress;
    address public defaultPoolAddress;
    address public backedTokenAddress;
    uint256 internal ETH; // deposited ether tracker
    uint256 internal BUSDCDebt;

    // --- Events ---

    event BorrowerOperationsAddressChanged(address _newBorrowerOperationsAddress);
    event TroveManagerAddressChanged(address _newTroveManagerAddress);
    event ActivePoolBUSDCDebtUpdated(uint _BUSDCDebt);
    event ActivePoolETHBalanceUpdated(uint _ETH);

    // --- Contract setters ---

    function setAddresses(
        address _borrowerOperationsAddress,
        address _troveManagerAddress,
        address _stabilityPoolAddress,
        address _defaultPoolAddress,
        address _backedTokenAddress
    ) external onlyOwner {
        checkContract(_borrowerOperationsAddress);
        checkContract(_troveManagerAddress);
        checkContract(_stabilityPoolAddress);
        checkContract(_defaultPoolAddress);
        checkContract(_backedTokenAddress);

        borrowerOperationsAddress = _borrowerOperationsAddress;
        troveManagerAddress = _troveManagerAddress;
        stabilityPoolAddress = _stabilityPoolAddress;
        defaultPoolAddress = _defaultPoolAddress;
        backedTokenAddress = _backedTokenAddress;

        emit BorrowerOperationsAddressChanged(_borrowerOperationsAddress);
        emit TroveManagerAddressChanged(_troveManagerAddress);
        emit StabilityPoolAddressChanged(_stabilityPoolAddress);
        emit DefaultPoolAddressChanged(_defaultPoolAddress);

        _renounceOwnership();
    }

    // --- Getters for public variables. Required by IPool interface ---

    /*
     * Returns the ETH state variable.
     *
     *Not necessarily equal to the the contract's raw ETH balance - ether can be forcibly sent to contracts.
     */
    function getETH() external view override returns (uint) {
        return ETH;
    }

    function getBUSDCDebt() external view override returns (uint) {
        return BUSDCDebt;
    }

    // --- Pool functionality ---

    function sendETH(address _account, uint _amount) external override {
        _requireCallerIsBOorTroveMorSP();
        ETH = ETH.sub(_amount);
        emit ActivePoolETHBalanceUpdated(ETH);
        emit EtherSent(_account, _amount);

        if (Address.isContract(_account)) {
            IERC20(backedTokenAddress).approve(_account, _amount);
            ITokenReceiver(_account).receiveBackedToken(_amount);
        } else {
            IERC20(backedTokenAddress).transfer(_account, _amount);
        }
    }

    function increaseBUSDCDebt(uint _amount) external override {
        _requireCallerIsBOorTroveM();
        BUSDCDebt = BUSDCDebt.add(_amount);
        ActivePoolBUSDCDebtUpdated(BUSDCDebt);
    }

    function decreaseBUSDCDebt(uint _amount) external override {
        _requireCallerIsBOorTroveMorSP();
        BUSDCDebt = BUSDCDebt.sub(_amount);
        ActivePoolBUSDCDebtUpdated(BUSDCDebt);
    }

    // --- 'require' functions ---

    function _requireCallerIsBorrowerOperationsOrDefaultPool() internal view {
        require(
            msg.sender == borrowerOperationsAddress || msg.sender == defaultPoolAddress,
            "ActivePool: Caller is neither BO nor Default Pool"
        );
    }

    function _requireCallerIsBOorTroveMorSP() internal view {
        require(
            msg.sender == borrowerOperationsAddress ||
                msg.sender == troveManagerAddress ||
                msg.sender == stabilityPoolAddress,
            "ActivePool: Caller is neither BorrowerOperations nor TroveManager nor StabilityPool"
        );
    }

    function _requireCallerIsBOorTroveM() internal view {
        require(
            msg.sender == borrowerOperationsAddress || msg.sender == troveManagerAddress,
            "ActivePool: Caller is neither BorrowerOperations nor TroveManager"
        );
    }

    function receiveBackedToken(uint256 amount) external {
        _requireCallerIsBorrowerOperationsOrDefaultPool();
        ETH = ETH.add(amount);
        IERC20(backedTokenAddress).transferFrom(msg.sender, address(this), amount);
        emit ActivePoolETHBalanceUpdated(ETH);
    }
}
