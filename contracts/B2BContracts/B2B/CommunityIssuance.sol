// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Interfaces/IB2BToken.sol";
import "../Interfaces/ICommunityIssuance.sol";
import "../Dependencies/BaseMath.sol";
import "../Dependencies/LiquityMath.sol";
import "../Dependencies/Ownable.sol";
import "../Dependencies/CheckContract.sol";
import "../Dependencies/SafeMath.sol";


contract CommunityIssuance is ICommunityIssuance, Ownable, CheckContract, BaseMath {
    using SafeMath for uint;

    // --- Data ---

    string constant public NAME = "CommunityIssuance";

    uint constant public SECONDS_IN_ONE_MINUTE = 60;

   /* The issuance factor F determines the curvature of the issuance curve.
    *
    * Minutes in one year: 60*24*365 = 525600
    *
    * For 50% of remaining tokens issued each year, with minutes as time units, we have:
    *
    * F ** 525600 = 0.5
    *
    * Re-arranging:
    *
    * 525600 * ln(F) = ln(0.5)
    * F = 0.5 ** (1/525600)
    * F = 0.999998681227695000
    */
    uint constant public ISSUANCE_FACTOR = 999998681227695000;

    /*
    * The community B2B supply cap is the starting balance of the Community Issuance contract.
    * It should be minted to this contract by B2BToken, when the token is deployed.
    *
    * Set to 32M (slightly less than 1/3) of total B2B supply.
    */
    uint constant public B2BSupplyCap = 32e24; // 32 million

    IB2BToken public b2bToken;

    address public stabilityPoolAddress;

    uint public totalB2BIssued;
    uint public immutable deploymentTime;

    // --- Events ---

    event B2BTokenAddressSet(address _b2bTokenAddress);
    event StabilityPoolAddressSet(address _stabilityPoolAddress);
    event TotalB2BIssuedUpdated(uint _totalB2BIssued);

    // --- Functions ---

    constructor() public {
        deploymentTime = block.timestamp;
    }

    function setAddresses
    (
        address _b2bTokenAddress,
        address _stabilityPoolAddress
    )
        external
        onlyOwner
        override
    {
        checkContract(_b2bTokenAddress);
        checkContract(_stabilityPoolAddress);

        b2bToken = IB2BToken(_b2bTokenAddress);
        stabilityPoolAddress = _stabilityPoolAddress;

        // When B2BToken deployed, it should have transferred CommunityIssuance's B2B entitlement
        uint B2BBalance = b2bToken.balanceOf(address(this));
        assert(B2BBalance >= B2BSupplyCap);

        emit B2BTokenAddressSet(_b2bTokenAddress);
        emit StabilityPoolAddressSet(_stabilityPoolAddress);

        _renounceOwnership();
    }

    function issueB2B() external override returns (uint) {
        _requireCallerIsStabilityPool();

        uint latestTotalB2BIssued = B2BSupplyCap.mul(_getCumulativeIssuanceFraction()).div(DECIMAL_PRECISION);
        uint issuance = latestTotalB2BIssued.sub(totalB2BIssued);

        totalB2BIssued = latestTotalB2BIssued;
        emit TotalB2BIssuedUpdated(latestTotalB2BIssued);

        return issuance;
    }

    /* Gets 1-f^t    where: f < 1

    f: issuance factor that determines the shape of the curve
    t:  time passed since last B2B issuance event  */
    function _getCumulativeIssuanceFraction() internal view returns (uint) {
        // Get the time passed since deployment
        uint timePassedInMinutes = block.timestamp.sub(deploymentTime).div(SECONDS_IN_ONE_MINUTE);

        // f^t
        uint power = LiquityMath._decPow(ISSUANCE_FACTOR, timePassedInMinutes);

        //  (1 - f^t)
        uint cumulativeIssuanceFraction = (uint(DECIMAL_PRECISION).sub(power));
        assert(cumulativeIssuanceFraction <= DECIMAL_PRECISION); // must be in range [0,1]

        return cumulativeIssuanceFraction;
    }

    function sendB2B(address _account, uint _B2Bamount) external override {
        _requireCallerIsStabilityPool();

        b2bToken.transfer(_account, _B2Bamount);
    }

    // --- 'require' functions ---

    function _requireCallerIsStabilityPool() internal view {
        require(msg.sender == stabilityPoolAddress, "CommunityIssuance: caller is not SP");
    }
}
