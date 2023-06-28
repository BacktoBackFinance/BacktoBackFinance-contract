// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface BackedOracleInterface {
    function latestAnswer() external view returns (int256);

    function decimals() external view returns (uint8);
}

interface BackedVaultInterface {
    function withdraw(address token, uint256 amount) external;
}

interface StableToken is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

contract BackedPool {
    using SafeERC20 for IERC20;

    StableToken public stableToken;
    IERC20 public backedToken;
    BackedOracleInterface public oracle;
    address public receiver;
    uint32 public lastMintAt;

    event Mint(address indexed to, uint256 stableTokenAmount);
    event Redeem(address indexed to, uint256 stableTokenAmount, uint256 backedTokenAmount);

     constructor(address _stableToken, address _backedToken, address _oracle, address _receiver) {
        require(_stableToken != address(0), "_stableToken is zero address");
        require(_backedToken != address(0), "_backedToken is zero address");
        require(_oracle != address(0), "_oracle is zero address");
        require(_receiver != address(0), "_receiver is zero address");

        stableToken = StableToken(_stableToken);
        backedToken = IERC20(_backedToken);
        oracle = BackedOracleInterface(_oracle);
        receiver = _receiver;
    }

    function mint(uint256 amount) external {
        require(amount > 0, "amount must be greater than 0");

        stableToken.mint(msg.sender, amount);
        backedToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Mint(msg.sender, amount);
    }

    function burn(uint256 backedTokenAmount) external {
        uint256 stableTokenAmount = (backedTokenAmount * one()) / uint256(oracle.latestAnswer());
        require(stableTokenAmount > 0 || backedTokenAmount > 0, "amount must be greater than 0");

        backedToken.safeTransfer(msg.sender, backedTokenAmount);
        stableToken.burn(msg.sender, stableTokenAmount);

        emit Redeem(msg.sender, stableTokenAmount, backedTokenAmount);
    }

    function rebase() external {
        require(block.timestamp - lastMintAt > 1 days, "rebase: mint once per day");
        lastMintAt = uint32(block.timestamp);

        uint256 backedTokenAmount = backedToken.totalSupply();
        uint256 stableTokenAmount = stableToken.totalSupply();
        uint256 backedTokenValue = (backedTokenAmount * one()) / uint256(oracle.latestAnswer());
        uint256 newStableToken = backedTokenValue - stableTokenAmount;
        stableToken.mint(receiver, newStableToken);

        emit Mint(receiver, newStableToken);
    }

    function one() private view returns (uint256) {
        return 10 ** oracle.decimals();
    }
}
