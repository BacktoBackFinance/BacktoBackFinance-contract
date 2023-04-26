// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Dependencies/SafeMath.sol";
import "../Dependencies/LiquityMath.sol";
import "../Dependencies/IERC20.sol";
import "../Interfaces/IBorrowerOperations.sol";
import "../Interfaces/ITroveManager.sol";
import "../Interfaces/IStabilityPool.sol";
import "../Interfaces/IPriceFeed.sol";
import "../Interfaces/IB2BStaking.sol";
import "./BorrowerOperationsScript.sol";
import "./ETHTransferScript.sol";
import "./B2BStakingScript.sol";
import "../Dependencies/console.sol";

contract BorrowerWrappersScript is BorrowerOperationsScript, ETHTransferScript, B2BStakingScript {
    using SafeMath for uint;

    string public constant NAME = "BorrowerWrappersScript";

    ITroveManager immutable troveManager;
    IStabilityPool immutable stabilityPool;
    IPriceFeed immutable priceFeed;
    IERC20 immutable busdcToken;
    IERC20 immutable b2bToken;
    IB2BStaking immutable b2bStaking;
    address immutable backedToken;

    constructor(
        address _borrowerOperationsAddress,
        address _troveManagerAddress,
        address _b2bStakingAddress,
        address _backedToken
    )
        public
        BorrowerOperationsScript(IBorrowerOperations(_borrowerOperationsAddress))
        B2BStakingScript(_b2bStakingAddress)
    {
        checkContract(_troveManagerAddress);
        ITroveManager troveManagerCached = ITroveManager(_troveManagerAddress);
        troveManager = troveManagerCached;

        IStabilityPool stabilityPoolCached = troveManagerCached.stabilityPool();
        checkContract(address(stabilityPoolCached));
        stabilityPool = stabilityPoolCached;

        IPriceFeed priceFeedCached = troveManagerCached.priceFeed();
        checkContract(address(priceFeedCached));
        priceFeed = priceFeedCached;

        address busdcTokenCached = address(troveManagerCached.busdcToken());
        checkContract(busdcTokenCached);
        busdcToken = IERC20(busdcTokenCached);

        address b2bTokenCached = address(troveManagerCached.b2bToken());
        checkContract(b2bTokenCached);
        b2bToken = IERC20(b2bTokenCached);

        IB2BStaking b2bStakingCached = troveManagerCached.b2bStaking();
        require(_b2bStakingAddress == address(b2bStakingCached), "BorrowerWrappersScript: Wrong B2BStaking address");
        b2bStaking = b2bStakingCached;

        checkContract(_backedToken);
        backedToken = _backedToken;
    }

    function claimCollateralAndOpenTrove(
        uint _maxFee,
        uint _BUSDCamount,
        address _upperHint,
        address _lowerHint,
        uint _backedAmount
    ) external {
        uint balanceBefore = address(this).balance;

        // Claim collateral
        borrowerOperations.claimCollateral();

        uint balanceAfter = address(this).balance;

        // already checked in CollSurplusPool
        assert(balanceAfter > balanceBefore);

        IERC20(backedToken).transferFrom(msg.sender, address(this), _backedAmount);
        uint totalCollateral = balanceAfter.sub(balanceBefore).add(_backedAmount);

        // Open trove with obtained collateral, plus collateral sent by user
        borrowerOperations.openTrove(_maxFee, _BUSDCamount, _upperHint, _lowerHint, totalCollateral);
    }

    function claimSPRewardsAndRecycle(uint _maxFee, address _upperHint, address _lowerHint) external {
        uint collBalanceBefore = address(this).balance;
        uint b2bBalanceBefore = b2bToken.balanceOf(address(this));

        // Claim rewards
        stabilityPool.withdrawFromSP(0);

        uint collBalanceAfter = address(this).balance;
        uint b2bBalanceAfter = b2bToken.balanceOf(address(this));
        uint claimedCollateral = collBalanceAfter.sub(collBalanceBefore);

        // Add claimed ETH to trove, get more BUSDC and stake it into the Stability Pool
        if (claimedCollateral > 0) {
            _requireUserHasTrove(address(this));
            uint BUSDCAmount = _getNetBUSDCAmount(claimedCollateral);
            borrowerOperations.adjustTrove(_maxFee, 0, BUSDCAmount, true, _upperHint, _lowerHint, claimedCollateral);
            // Provide withdrawn BUSDC to Stability Pool
            if (BUSDCAmount > 0) {
                stabilityPool.provideToSP(BUSDCAmount, address(0));
            }
        }

        // Stake claimed B2B
        uint claimedB2B = b2bBalanceAfter.sub(b2bBalanceBefore);
        if (claimedB2B > 0) {
            b2bStaking.stake(claimedB2B);
        }
    }

    function claimStakingGainsAndRecycle(uint _maxFee, address _upperHint, address _lowerHint) external {
        uint collBalanceBefore = address(this).balance;
        uint busdcBalanceBefore = busdcToken.balanceOf(address(this));
        uint b2bBalanceBefore = b2bToken.balanceOf(address(this));

        // Claim gains
        b2bStaking.unstake(0);

        uint gainedCollateral = address(this).balance.sub(collBalanceBefore); // stack too deep issues :'(
        uint gainedBUSDC = busdcToken.balanceOf(address(this)).sub(busdcBalanceBefore);

        uint netBUSDCAmount;
        // Top up trove and get more BUSDC, keeping ICR constant
        if (gainedCollateral > 0) {
            _requireUserHasTrove(address(this));
            netBUSDCAmount = _getNetBUSDCAmount(gainedCollateral);
            borrowerOperations.adjustTrove(_maxFee, 0, netBUSDCAmount, true, _upperHint, _lowerHint, gainedCollateral);
        }

        uint totalBUSDC = gainedBUSDC.add(netBUSDCAmount);
        if (totalBUSDC > 0) {
            stabilityPool.provideToSP(totalBUSDC, address(0));

            // Providing to Stability Pool also triggers B2B claim, so stake it if any
            uint b2bBalanceAfter = b2bToken.balanceOf(address(this));
            uint claimedB2B = b2bBalanceAfter.sub(b2bBalanceBefore);
            if (claimedB2B > 0) {
                b2bStaking.stake(claimedB2B);
            }
        }
    }

    function _getNetBUSDCAmount(uint _collateral) internal returns (uint) {
        uint price = priceFeed.fetchPrice();
        uint ICR = troveManager.getCurrentICR(address(this), price);

        uint BUSDCAmount = _collateral.mul(price).div(ICR);
        uint borrowingRate = troveManager.getBorrowingRateWithDecay();
        uint netDebt = BUSDCAmount.mul(LiquityMath.DECIMAL_PRECISION).div(
            LiquityMath.DECIMAL_PRECISION.add(borrowingRate)
        );

        return netDebt;
    }

    function _requireUserHasTrove(address _depositor) internal view {
        require(
            troveManager.getTroveStatus(_depositor) == 1,
            "BorrowerWrappersScript: caller must have an active trove"
        );
    }
}
