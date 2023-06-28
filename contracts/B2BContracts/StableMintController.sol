// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "./Dependencies/IStableMintController.sol";
import "./Dependencies/Ownable.sol";
import "./Dependencies/SafeMath.sol";

contract StableMintController is Ownable, IStableMintController {
    using SafeMath for uint256;

    uint256 constant public DECIMAL_PRECISION = 1e18;
    uint256 constant public ETH_RATIO = 8 * DECIMAL_PRECISION;
    uint256 constant public BACKED_RATIO = 2 * DECIMAL_PRECISION;

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
    ) external onlyOwner {
        require(_troveManagerAddress != address(0), "_troveManagerAddress is zero address");
        require(_stabilityPoolAddress != address(0), "stabilityPoolAddress is zero address");
        require(_ethBoAddress != address(0), "_ethBoAddress is zero address");
        require(_backedBoAddress != address(0), "_backedBoAddress is zero address");
        require(_ethBoAddress != _backedBoAddress, "invalid _ethBoAddress and _backedBoAddress");

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
        if (borrowerOperations == ethBoAddress) {
            if (initMintCaps[ethBoAddress] > totalSupplys[ethBoAddress]) {
                return initMintCaps[ethBoAddress] - totalSupplys[ethBoAddress];
            } else if (totalSupplys[backedBoAddress].mul(ETH_RATIO) > totalSupplys[ethBoAddress].mul(BACKED_RATIO)) {
                return totalSupplys[backedBoAddress].mul(ETH_RATIO) - totalSupplys[ethBoAddress].mul(BACKED_RATIO);
            }
        } else {
            if (initMintCaps[backedBoAddress] > totalSupplys[backedBoAddress]) {
                return initMintCaps[backedBoAddress] - totalSupplys[backedBoAddress];
            } else if (totalSupplys[ethBoAddress].mul(ETH_RATIO) > totalSupplys[backedBoAddress].mul(BACKED_RATIO)) {
                return totalSupplys[ethBoAddress].mul(ETH_RATIO) - totalSupplys[backedBoAddress].mul(BACKED_RATIO);
            }
        }
        return 0;
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
