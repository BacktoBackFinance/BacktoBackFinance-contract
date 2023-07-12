// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Dependencies/CheckContract.sol";
import "../Interfaces/IBorrowerOperations.sol";

contract BorrowerOperationsScript is CheckContract {
    IBorrowerOperations immutable borrowerOperations;

    constructor(IBorrowerOperations _borrowerOperations) public {
        checkContract(address(_borrowerOperations));
        borrowerOperations = _borrowerOperations;
    }

    function openTrove(
        uint _maxFee,
        uint _BUSDCamount,
        address _upperHint,
        address _lowerHint,
        uint _backedAmount
    ) external {
        borrowerOperations.openTrove(_maxFee, _BUSDCamount, _upperHint, _lowerHint, _backedAmount);
    }

    function addColl(address _upperHint, address _lowerHint, uint _backedAmount) external {
        borrowerOperations.addColl(_upperHint, _lowerHint, _backedAmount);
    }

    function withdrawColl(uint _amount, address _upperHint, address _lowerHint) external {
        borrowerOperations.withdrawColl(_amount, _upperHint, _lowerHint);
    }

    function withdrawBUSDC(
        uint _maxFee,
        uint _amount,
        address _upperHint,
        address _lowerHint
    ) external {
        borrowerOperations.withdrawBUSDC(_maxFee, _amount, _upperHint, _lowerHint);
    }

    function repayBUSDC(uint _amount, address _upperHint, address _lowerHint) external {
        borrowerOperations.repayBUSDC(_amount, _upperHint, _lowerHint);
    }

    function closeTrove() external {
        borrowerOperations.closeTrove();
    }

    function adjustTrove(
        uint _maxFee,
        uint _collWithdrawal,
        uint _debtChange,
        bool isDebtIncrease,
        address _upperHint,
        address _lowerHint,
        uint _backedAmount
    ) external {
        borrowerOperations.adjustTrove(
            _maxFee,
            _collWithdrawal,
            _debtChange,
            isDebtIncrease,
            _upperHint,
            _lowerHint,
            _backedAmount
        );
    }

    function claimCollateral() external {
        borrowerOperations.claimCollateral();
    }
}
