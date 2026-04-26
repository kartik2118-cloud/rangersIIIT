// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FestToken
 * @notice ERC-20 token for the FestPass campus festival payment system.
 * @dev Symbol: FEST. Owner can mint demo tokens to test users.
 */
contract FestToken is ERC20, Ownable {
    constructor() ERC20("FestToken", "FEST") Ownable(msg.sender) {}

    /**
     * @notice Mint demo tokens to a student wallet.
     * @param to   Student smart wallet address.
     * @param amount Number of FEST tokens (in wei).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
