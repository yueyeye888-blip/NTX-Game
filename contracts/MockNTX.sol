// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockNTX
 * @dev 用于测试的临时 NTX 代币合约
 * 生产环境中将替换为真实的 NTX 代币地址
 */
contract MockNTX is ERC20 {
    constructor() ERC20("NTX Token", "NTX") {
        // 铸造 1,000,000 个代币给部署者用于测试
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    // 允许任何人领取测试代币 (仅用于测试网!)
    function faucet() external {
        _mint(msg.sender, 1000 * 10**decimals());
    }
}
