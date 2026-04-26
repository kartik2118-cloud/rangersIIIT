// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FestRegistry
 * @notice Registry of festivals and whitelisted merchants for FestPass.
 */
contract FestRegistry is Ownable {
    struct Merchant {
        address wallet;
        bool active;
    }

    struct Fest {
        address organizer;
        bool active;
        mapping(bytes32 => Merchant) merchants;
    }

    mapping(bytes32 => Fest) public fests;

    event FestAdded(bytes32 indexed festId, address organizer);
    event MerchantWhitelisted(bytes32 indexed festId, bytes32 indexed merchantId, address wallet);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new festival.
     * @param festId    Unique identifier for the fest.
     * @param organizer Wallet address of the fest organizer.
     */
    function addFest(bytes32 festId, address organizer) external onlyOwner {
        fests[festId].organizer = organizer;
        fests[festId].active = true;
        emit FestAdded(festId, organizer);
    }

    /**
     * @notice Whitelist a merchant for a specific fest.
     * @param festId     The fest to register the merchant under.
     * @param merchantId Unique identifier for the merchant.
     * @param wallet     Merchant's payment wallet address.
     */
    function whitelistMerchant(bytes32 festId, bytes32 merchantId, address wallet) external onlyOwner {
        require(fests[festId].active, "Fest not active");
        fests[festId].merchants[merchantId] = Merchant(wallet, true);
        emit MerchantWhitelisted(festId, merchantId, wallet);
    }

    function isMerchantActive(bytes32 festId, bytes32 merchantId) external view returns (bool) {
        return fests[festId].merchants[merchantId].active;
    }

    function getMerchantWallet(bytes32 festId, bytes32 merchantId) external view returns (address) {
        return fests[festId].merchants[merchantId].wallet;
    }
}
