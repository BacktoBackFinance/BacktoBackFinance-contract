// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "./Dependencies/IStableMintController.sol";
import "./Dependencies/LiquityMath.sol";
import "./Dependencies/Ownable.sol";
import "./Dependencies/SafeMath.sol";

contract StableMintController is Ownable, IStableMintController {
    using SafeMath for uint256;

    uint256 constant public DECIMAL_PRECISION = 1e18;
    uint256 constant public ETH_RATIO = 8;
    uint256 constant public BACKED_RATIO = 2;
    uint256 constant public ADJUST_RATIO = DECIMAL_PRECISION + DECIMAL_PRECISION / 10; // 110%

    address public troveManagerAddress;
    address public stabilityPoolAddress;
    // borrowerOperations address of ETH
    address public ethBoAddress;
    // borrowerOperations address of backed token
    address public backedBoAddress;
    // initial mint cap of stable token
    mapping(address => uint256) public initMintCaps;
    // total amount of minted stable token
    mapping(address => uint256) public totalSupplys;

    function setParams(
        address _troveManagerAddress,
        address _stabilityPoolAddress,
        address _ethBoAddress,
        address _backedBoAddress,
        uint256 _initMintCapsOfEthBO,
        uint256 _initMintCapsOfBackedBO
    ) external override onlyOwner {
        require(_troveManagerAddress != address(0), "_troveManagerAddress is zero address");
        require(_stabilityPoolAddress != address(0), "stabilityPoolAddress is zero address");
        require(_ethBoAddress != address(0), "_ethBoAddress is zero address");
        require(_backedBoAddress != address(0), "_backedBoAddress is zero address");
        require(_ethBoAddress != _backedBoAddress, "bo address should be different");

        troveManagerAddress = _troveManagerAddress;
        stabilityPoolAddress = _stabilityPoolAddress;
        ethBoAddress = _ethBoAddress;
        backedBoAddress = _backedBoAddress;
        initMintCaps[ethBoAddress] = _initMintCapsOfEthBO;
        initMintCaps[backedBoAddress] = _initMintCapsOfBackedBO;
    }

    function increaseMint(address borrowerOperations, uint256 amount) external override {
        _requireCallerIsBOorTroveMorSP();
        require(borrowerOperations == ethBoAddress || borrowerOperations == backedBoAddress, "invalid borrowerOperations");
        totalSupplys[borrowerOperations] = totalSupplys[borrowerOperations].add(amount);
    }

    function decreaseMint(address borrowerOperations, uint256 amount) external override {
        _requireCallerIsBOorTroveMorSP();
        require(borrowerOperations == ethBoAddress || borrowerOperations == backedBoAddress, "invalid borrowerOperations");
        totalSupplys[borrowerOperations] = totalSupplys[borrowerOperations].sub(amount);
    }

    function availableAmount(address borrowerOperations) public override view returns (uint256) {
        if (borrowerOperations != ethBoAddress && borrowerOperations != backedBoAddress) {
            return 0;
        }

        uint256 amount1 = 0;
        uint256 amount2 = 0;
        if (borrowerOperations == ethBoAddress) {
            if (initMintCaps[ethBoAddress] > totalSupplys[ethBoAddress]) {
                amount1 = initMintCaps[ethBoAddress] - totalSupplys[ethBoAddress];
            }
            uint256 _amount2 = totalSupplys[backedBoAddress].mul(ETH_RATIO).div(BACKED_RATIO).mul(ADJUST_RATIO).div(DECIMAL_PRECISION);
            if (_amount2 > totalSupplys[ethBoAddress]) {
                amount2 = _amount2 - totalSupplys[ethBoAddress];
            }
        } else {
            if (initMintCaps[backedBoAddress] > totalSupplys[backedBoAddress]) {
                amount1 = initMintCaps[backedBoAddress] - totalSupplys[backedBoAddress];
            }
            uint256 _amount2 = totalSupplys[ethBoAddress].mul(BACKED_RATIO).div(ETH_RATIO).mul(ADJUST_RATIO).div(DECIMAL_PRECISION);
            if (_amount2 > totalSupplys[backedBoAddress]) {
                amount2 = _amount2 - totalSupplys[backedBoAddress];
            }
        }

        return LiquityMath._max(amount1, amount2);
    }

    function _requireCallerIsBOorTroveMorSP() internal view {
        require(
            msg.sender == ethBoAddress ||
            msg.sender == backedBoAddress ||
            msg.sender == troveManagerAddress ||
            msg.sender == stabilityPoolAddress,
            "Caller is neither BorrowerOperations nor TroveManager nor StabilityPool"
        );
    }
}
