// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Dependencies/IStableMintController.sol";
import "../Dependencies/LiquityMath.sol";
import "../Dependencies/Ownable.sol";
import "../Dependencies/SafeMath.sol";

contract StableMintControllerTester is Ownable, IStableMintController {
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

    function setAddresses(
        address _troveManagerAddress,
        address _stabilityPoolAddress,
        address _ethBoAddress,
        address _backedBoAddress,
        uint256 _initMintCapsOfEthBO,
        uint256 _initMintCapsOfBackedBO
    ) external override onlyOwner {
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

    function availableAmount(address) public override view returns (uint256) {
        return uint256(-1);
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
