// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FESTToken
 * @dev ERC-20 token used as the payment currency within FestPass.
 *      Organizers receive minting rights to top-up student wallets.
 */
contract FESTToken is ERC20, Ownable {
    // ─── Events ──────────────────────────────────────────────────────────────
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    // ─── State ────────────────────────────────────────────────────────────────
    mapping(address => bool) public minters;

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "FESTToken: caller is not a minter");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address initialOwner) ERC20("FestPass Token", "FEST") Ownable(initialOwner) {
        // Mint 1,000,000 FEST to the deployer (organizer float)
        _mint(initialOwner, 1_000_000 * 10 ** decimals());
    }

    // ─── Admin Functions ──────────────────────────────────────────────────────

    /// @notice Add an address as an authorised minter (e.g. organizer wallet)
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    /// @notice Remove minting rights
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    // ─── Minting ─────────────────────────────────────────────────────────────

    /// @notice Mint FEST tokens into a student's smart wallet
    /// @param to     Recipient address (student smart wallet)
    /// @param amount Amount in token units (use 10**18 for 1 FEST)
    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }
}
