// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../TroveManager.sol";
import "../BorrowerOperations.sol";
import "../StabilityPool.sol";
import "../BUSDCToken.sol";

contract EchidnaProxy {
    TroveManager troveManager;
    BorrowerOperations borrowerOperations;
    StabilityPool stabilityPool;
    BUSDCToken busdcToken;

    constructor(
        TroveManager _troveManager,
        BorrowerOperations _borrowerOperations,
        StabilityPool _stabilityPool,
        BUSDCToken _busdcToken
    ) public {
        troveManager = _troveManager;
        borrowerOperations = _borrowerOperations;
        stabilityPool = _stabilityPool;
        busdcToken = _busdcToken;
    }

    // TroveManager

    function liquidatePrx(address _user) external {
        troveManager.liquidate(_user);
    }

    function liquidateTrovesPrx(uint _n) external {
        troveManager.liquidateTroves(_n);
    }

    function batchLiquidateTrovesPrx(address[] calldata _troveArray) external {
        troveManager.batchLiquidateTroves(_troveArray);
    }

    function redeemCollateralPrx(
        uint _BUSDCamount,
        address _firstRedemptionHint,
        address _upperPartialRedemptionHint,
        address _lowerPartialRedemptionHint,
        uint _partialRedemptionHintNICR,
        uint _maxIterations,
        uint _maxFee
    ) external {
        troveManager.redeemCollateral(
            _BUSDCamount,
            _firstRedemptionHint,
            _upperPartialRedemptionHint,
            _lowerPartialRedemptionHint,
            _partialRedemptionHintNICR,
            _maxIterations,
            _maxFee
        );
    }

    // Borrower Operations
    function openTrovePrx(
        uint _backedAmount,
        uint _BUSDCamount,
        address _upperHint,
        address _lowerHint,
        uint _maxFee
    ) external {
        borrowerOperations.openTrove(_maxFee, _BUSDCamount, _upperHint, _lowerHint, _backedAmount);
    }

    function addCollPrx(uint _backedAmount, address _upperHint, address _lowerHint) external {
        borrowerOperations.addColl(_upperHint, _lowerHint, _backedAmount);
    }

    function withdrawCollPrx(uint _amount, address _upperHint, address _lowerHint) external {
        borrowerOperations.withdrawColl(_amount, _upperHint, _lowerHint);
    }

    function withdrawBUSDCPrx(
        uint _amount,
        address _upperHint,
        address _lowerHint,
        uint _maxFee
    ) external {
        borrowerOperations.withdrawBUSDC(_maxFee, _amount, _upperHint, _lowerHint);
    }

    function repayBUSDCPrx(uint _amount, address _upperHint, address _lowerHint) external {
        borrowerOperations.repayBUSDC(_amount, _upperHint, _lowerHint);
    }

    function closeTrovePrx() external {
        borrowerOperations.closeTrove();
    }

    function adjustTrovePrx(
        uint _backedAmount,
        uint _collWithdrawal,
        uint _debtChange,
        bool _isDebtIncrease,
        address _upperHint,
        address _lowerHint,
        uint _maxFee
    ) external payable {
        borrowerOperations.adjustTrove(
            _maxFee,
            _collWithdrawal,
            _debtChange,
            _isDebtIncrease,
            _upperHint,
            _lowerHint,
            _backedAmount
        );
    }

    // Pool Manager
    function provideToSPPrx(uint _amount, address _frontEndTag) external {
        stabilityPool.provideToSP(_amount, _frontEndTag);
    }

    function withdrawFromSPPrx(uint _amount) external {
        stabilityPool.withdrawFromSP(_amount);
    }

    // BUSDC Token

    function transferPrx(address recipient, uint256 amount) external returns (bool) {
        return busdcToken.transfer(recipient, amount);
    }

    function approvePrx(address spender, uint256 amount) external returns (bool) {
        return busdcToken.approve(spender, amount);
    }

    function transferFromPrx(address sender, address recipient, uint256 amount) external returns (bool) {
        return busdcToken.transferFrom(sender, recipient, amount);
    }

    function increaseAllowancePrx(address spender, uint256 addedValue) external returns (bool) {
        return busdcToken.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowancePrx(address spender, uint256 subtractedValue) external returns (bool) {
        return busdcToken.decreaseAllowance(spender, subtractedValue);
    }
}
