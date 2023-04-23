// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Interfaces/IBUSDCToken.sol";

contract BUSDCTokenCaller {
    IBUSDCToken BUSDC;

    function setBUSDC(IBUSDCToken _BUSDC) external {
        BUSDC = _BUSDC;
    }

    function busdcMint(address _account, uint _amount) external {
        BUSDC.mint(_account, _amount);
    }

    function busdcBurn(address _account, uint _amount) external {
        BUSDC.burn(_account, _amount);
    }

    function busdcSendToPool(address _sender,  address _poolAddress, uint256 _amount) external {
        BUSDC.sendToPool(_sender, _poolAddress, _amount);
    }

    function busdcReturnFromPool(address _poolAddress, address _receiver, uint256 _amount ) external {
        BUSDC.returnFromPool(_poolAddress, _receiver, _amount);
    }
}
