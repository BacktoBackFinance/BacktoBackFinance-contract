// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Dependencies/SafeMath.sol";
import "../Dependencies/LiquityMath.sol";
import "../Dependencies/IERC20.sol";
import "../Interfaces/IBorrowerOperations.sol";
import "../Interfaces/ITroveManager.sol";
import "../Interfaces/IStabilityPool.sol";
import "../Interfaces/IPriceFeed.sol";
import "../Interfaces/ILQTYStaking.sol";
import "./BorrowerOperationsScript.sol";
import "./ETHTransferScript.sol";
import "./LQTYStakingScript.sol";
import "../Dependencies/console.sol";

contract BorrowerWrappersScript is BorrowerOperationsScript, ETHTransferScript, LQTYStakingScript {
    using SafeMath for uint;

    string public constant NAME = "BorrowerWrappersScript";

    ITroveManager immutable troveManager;
    IStabilityPool immutable stabilityPool;
    IPriceFeed immutable priceFeed;
    IERC20 immutable busdcToken;
    IERC20 immutable lqtyToken;
    ILQTYStaking immutable lqtyStaking;
    address immutable backedToken;

    constructor(
        address _borrowerOperationsAddress,
        address _troveManagerAddress,
        address _lqtyStakingAddress,
        address _backedToken
    )
        public
        BorrowerOperationsScript(IBorrowerOperations(_borrowerOperationsAddress))
        LQTYStakingScript(_lqtyStakingAddress)
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

        address lqtyTokenCached = address(troveManagerCached.lqtyToken());
        checkContract(lqtyTokenCached);
        lqtyToken = IERC20(lqtyTokenCached);

        ILQTYStaking lqtyStakingCached = troveManagerCached.lqtyStaking();
        require(_lqtyStakingAddress == address(lqtyStakingCached), "BorrowerWrappersScript: Wrong LQTYStaking address");
        lqtyStaking = lqtyStakingCached;

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
        uint lqtyBalanceBefore = lqtyToken.balanceOf(address(this));

        // Claim rewards
        stabilityPool.withdrawFromSP(0);

        uint collBalanceAfter = address(this).balance;
        uint lqtyBalanceAfter = lqtyToken.balanceOf(address(this));
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

        // Stake claimed LQTY
        uint claimedLQTY = lqtyBalanceAfter.sub(lqtyBalanceBefore);
        if (claimedLQTY > 0) {
            lqtyStaking.stake(claimedLQTY);
        }
    }

    function claimStakingGainsAndRecycle(uint _maxFee, address _upperHint, address _lowerHint) external {
        uint collBalanceBefore = address(this).balance;
        uint busdcBalanceBefore = busdcToken.balanceOf(address(this));
        uint lqtyBalanceBefore = lqtyToken.balanceOf(address(this));

        // Claim gains
        lqtyStaking.unstake(0);

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

            // Providing to Stability Pool also triggers LQTY claim, so stake it if any
            uint lqtyBalanceAfter = lqtyToken.balanceOf(address(this));
            uint claimedLQTY = lqtyBalanceAfter.sub(lqtyBalanceBefore);
            if (claimedLQTY > 0) {
                lqtyStaking.stake(claimedLQTY);
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
