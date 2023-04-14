// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface AggregatorInterface {
    function latestAnswer() external view returns (int256);
}

interface PriceFeedInterface {
    function fetchPrice() external view returns (uint256);
}

contract BackedOracleProxy is PriceFeedInterface {
    AggregatorInterface public aggregator;

    constructor(address _aggregator) {
        require(_aggregator != address(0), "_aggregator is zero address");

        aggregator = AggregatorInterface(_aggregator);
    }

    function fetchPrice() external view override returns (uint256) {
        return uint256(aggregator.latestAnswer());
    }
}
