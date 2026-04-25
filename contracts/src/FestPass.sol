// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title FestPass
 * @dev QR-code-based payment contract for college fests on Base.
 *
 *  Flow:
 *   1. Organizer registers a vendor (stallId + vendorAddress).
 *   2. Organizer backend generates a signed PaymentRequest and encodes it in a QR code.
 *   3. Student scans QR, calls pay() which verifies the request and transfers FEST.
 *   4. nonces prevent replay attacks; expiry prevents stale QRs.
 */
contract FestPass is Ownable {
    using ECDSA for bytes32;

    // ─── Types ────────────────────────────────────────────────────────────────
    struct Vendor {
        address wallet;
        string  name;
        bool    active;
    }

    // ─── Events ──────────────────────────────────────────────────────────────
    event VendorRegistered(bytes32 indexed stallId, address indexed wallet, string name);
    event VendorDeactivated(bytes32 indexed stallId);
    event Payment(
        bytes32 indexed stallId,
        address indexed student,
        address indexed vendor,
        uint256 amount,
        bytes32 nonce
    );

    // ─── State ────────────────────────────────────────────────────────────────
    IERC20  public immutable festToken;
    address public           signer;                  // Backend hot-wallet that signs QRs

    mapping(bytes32 => Vendor)  public vendors;       // stallId → Vendor
    mapping(bytes32 => bool)    public usedNonces;    // nonce → spent

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(
        address _festToken,
        address _signer,
        address initialOwner
    ) Ownable(initialOwner) {
        festToken = IERC20(_festToken);
        signer    = _signer;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Update the signing key (e.g. key rotation)
    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    }

    /// @notice Register a new vendor stall
    function registerVendor(bytes32 stallId, address wallet, string calldata name)
        external onlyOwner
    {
        require(wallet != address(0), "FestPass: zero address");
        vendors[stallId] = Vendor({ wallet: wallet, name: name, active: true });
        emit VendorRegistered(stallId, wallet, name);
    }

    /// @notice Deactivate a vendor (soft delete)
    function deactivateVendor(bytes32 stallId) external onlyOwner {
        vendors[stallId].active = false;
        emit VendorDeactivated(stallId);
    }

    // ─── Payment ─────────────────────────────────────────────────────────────

    /**
     * @notice Execute a QR-code payment.
     * @param stallId  Vendor stall identifier (bytes32 slug)
     * @param amount   FEST amount in wei (18 decimals)
     * @param expiry   Unix timestamp after which the QR is invalid
     * @param nonce    Unique random bytes32 embedded in the QR
     * @param sig      ECDSA signature produced by the backend signer
     *
     * The signed message is: keccak256(stallId, amount, expiry, nonce, chainId, address(this))
     */
    function pay(
        bytes32 stallId,
        uint256 amount,
        uint256 expiry,
        bytes32 nonce,
        bytes calldata sig
    ) external {
        // ── Validations ──────────────────────────────────────────────────────
        require(block.timestamp <= expiry,      "FestPass: QR code expired");
        require(!usedNonces[nonce],             "FestPass: nonce already used");

        Vendor storage vendor = vendors[stallId];
        require(vendor.active,                  "FestPass: vendor not active");

        // ── Signature verification ───────────────────────────────────────────
        bytes32 msgHash = keccak256(abi.encodePacked(
            stallId, amount, expiry, nonce, block.chainid, address(this)
        ));
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(msgHash);
        address recovered = ethHash.recover(sig);
        require(recovered == signer,            "FestPass: invalid signature");

        // ── Mark nonce used ───────────────────────────────────────────────────
        usedNonces[nonce] = true;

        // ── Transfer ──────────────────────────────────────────────────────────
        // Student must have approved FestPass contract before calling pay()
        require(
            festToken.transferFrom(msg.sender, vendor.wallet, amount),
            "FestPass: transfer failed"
        );

        emit Payment(stallId, msg.sender, vendor.wallet, amount, nonce);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// @notice Reconstruct the hash that should have been signed for a given request
    function getPaymentHash(
        bytes32 stallId,
        uint256 amount,
        uint256 expiry,
        bytes32 nonce
    ) external view returns (bytes32) {
        return keccak256(abi.encodePacked(
            stallId, amount, expiry, nonce, block.chainid, address(this)
        ));
    }
}
