// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

//import "../Dependencies/console.sol";


contract NonPayable {
    bool isPayable;
    address token;

    function setPayable(bool _isPayable) external {
        isPayable = _isPayable;
    }

    function setToken(address _token) external {
        token = _token;
    }

    function approve(address spender, uint256 amount) external {
        // approve: 0x095ea7b3
        (bool success, bytes memory returnData) = token.call(abi.encodeWithSelector(0x095ea7b3, spender, amount));
        require(success, string(returnData));
    }

    function receiveBackedToken(uint256 amount) external {
        // transferFrom: 0x23b872dd
        (bool success, bytes memory returnData) = token.call(abi.encodeWithSelector(0x23b872dd, msg.sender, address(this), amount));
        require(success, string(returnData));
    }

    function forward(address _dest, bytes calldata _data) external payable {
        (bool success, bytes memory returnData) = _dest.call{ value: msg.value }(_data);
        //console.logBytes(returnData);
        require(success, string(returnData));
    }

    receive() external payable {
        require(isPayable);
    }
}
