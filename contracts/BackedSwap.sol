// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

interface BackedOracleInterface {
    function latestAnswer() external view returns (int256);

    function decimals() external view returns (uint8);
}

interface BackedVaultInterface {
    function withdraw(address token, uint256 amount) external;
}

/// @title The implementation of BackedSwap
contract BackedSwap is ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// @dev Stable token, e.g. USDT/USDC
    IERC20Upgradeable public stableToken;
    /// @dev Backed IB01 $ Treasury Bond 0-1yr (bIB01) token
    IERC20Upgradeable public backedToken;
    /// @dev Price oracle for IB01/USDT
    BackedOracleInterface public oracle;
    /// @dev Vault for storing IB01 and USDT
    BackedVaultInterface public backedVault;

    event Mint(address indexed to, uint256 stableTokenAmount, uint256 backedTokenAmount);
    event Redeem(address indexed to, uint256 stableTokenAmount, uint256 backedTokenAmount);

    function initialize(
        address _stableToken,
        address _backedToken,
        address _oracle,
        address _backedVault
    ) public initializer {
        require(_stableToken != address(0), "_stableToken is zero address");
        require(_backedToken != address(0), "_backedToken is zero address");
        require(_oracle != address(0), "_oracle is zero address");
        require(_backedVault != address(0), "_backedVault is zero address");

        __ReentrancyGuard_init();
        stableToken = IERC20Upgradeable(_stableToken);
        backedToken = IERC20Upgradeable(_backedToken);
        oracle = BackedOracleInterface(_oracle);
        backedVault = BackedVaultInterface(_backedVault);
    }

    function mint(uint256 stableTokenAmount) external nonReentrant {
        uint256 backedTokenAmount = (stableTokenAmount * uint256(oracle.latestAnswer())) / one();
        require(stableTokenAmount > 0 || backedTokenAmount > 0, "amount must be greater than 0");

        // deposit stable token to vault
        stableToken.safeTransferFrom(msg.sender, address(this), stableTokenAmount);
        stableToken.safeTransfer(address(backedVault), stableTokenAmount);

        // withdraw backed token from vault and send to user
        backedVault.withdraw(address(backedToken), backedTokenAmount);
        backedToken.safeTransfer(msg.sender, backedTokenAmount);

        emit Mint(msg.sender, stableTokenAmount, backedTokenAmount);
    }

    function redeem(uint256 backedTokenAmount) external nonReentrant {
        uint256 stableTokenAmount = (backedTokenAmount * one()) / uint256(oracle.latestAnswer());
        require(stableTokenAmount > 0 || backedTokenAmount > 0, "amount must be greater than 0");

        // deposit backed token to vault
        backedToken.safeTransferFrom(msg.sender, address(this), backedTokenAmount);
        backedToken.safeTransfer(address(backedVault), backedTokenAmount);

        // withdraw stable token from vault and send to user
        backedVault.withdraw(address(stableToken), stableTokenAmount);
        stableToken.safeTransfer(msg.sender, stableTokenAmount);

        emit Redeem(msg.sender, stableTokenAmount, backedTokenAmount);
    }

    function one() private view returns (uint256) {
        return 10 ** oracle.decimals();
    }
}
