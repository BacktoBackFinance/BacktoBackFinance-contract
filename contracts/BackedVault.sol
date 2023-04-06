// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

/// @title The implementation of BackedVault
contract BackedVault is OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// @dev BackedSwap contract
    address public backedSwap;

    event Withdraw(address indexed to, address indexed token, uint256 amount);
    event EmergencyWithdraw(address indexed to, address indexed token, uint256 amount);

    function initialize() public initializer {
        __Ownable_init();
    }

    function withdraw(address token, uint256 amount) external onlySwap {
        IERC20Upgradeable(token).safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, token, amount);
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20Upgradeable(token).safeTransfer(msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, token, amount);
    }

    function setBackedSwap(address _swap) external onlyOwner {
        require(_swap != address(0), "invalid address");
        backedSwap = _swap;
    }

    modifier onlySwap() {
        require(msg.sender == backedSwap, "only swap");
        _;
    }
}
