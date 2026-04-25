// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FestPay
 * @author FestPass Team
 * @notice Handles QR-code-triggered FEST token payments from students to merchants
 *         at college fests deployed on the Base network.
 *
 * @dev Design decisions for low gas on Base:
 *   - Inherits only ReentrancyGuard (no Ownable overhead — no admin state needed here).
 *   - Token address is immutable: stored once, never re-read from storage after deploy.
 *   - No internal balance accounting; we rely entirely on the FEST ERC-20 ledger.
 *   - transferFrom is the single external call; guard prevents any re-entrant exploit.
 *
 * Pre-condition (handled on the frontend / student app):
 *   Student must call festToken.approve(address(FestPay), amount) before paying.
 */
contract FestPay is ReentrancyGuard {

    // ─── Immutable State ──────────────────────────────────────────────────────

    /// @notice The FEST ERC-20 token used as payment currency.
    /// Stored as immutable → no SLOAD cost after deployment.
    IERC20 public immutable festToken;

    // ─── Events ───────────────────────────────────────────────────────────────

    /**
     * @notice Emitted on every successful payment.
     * @param festId   Fest / event identifier the payment belongs to.
     * @param merchant Vendor / merchant address that received the tokens.
     * @param student  Student address that initiated the payment.
     * @param amount   FEST amount transferred (18-decimal units).
     */
    event PaymentReceived(
        uint256 indexed festId,
        address indexed merchant,
        address indexed student,
        uint256         amount
    );

    // ─── Errors ───────────────────────────────────────────────────────────────
    // Custom errors cost less gas than require strings (EIP-838).

    /// @dev Thrown when merchant address is the zero address.
    error FestPay__InvalidMerchant();

    /// @dev Thrown when amount is zero.
    error FestPay__ZeroAmount();

    /// @dev Thrown when the ERC-20 transferFrom call returns false.
    error FestPay__TransferFailed();

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _festToken Address of the deployed FESTToken (ERC-20) contract.
     */
    constructor(address _festToken) {
        require(_festToken != address(0), "FestPay: zero token address");
        festToken = IERC20(_festToken);
    }

    // ─── External Functions ───────────────────────────────────────────────────

    /**
     * @notice Transfer FEST tokens from the calling student to a merchant.
     *
     * @param festId   Identifier of the fest/event (used for event indexing & backend tracking).
     * @param merchant Wallet address of the vendor / merchant stall.
     * @param amount   Amount of FEST (in 18-decimal wei) to transfer.
     *
     * Emits {PaymentReceived}.
     *
     * Requirements:
     *   - `merchant` must not be the zero address.
     *   - `amount` must be greater than zero.
     *   - Caller must have approved this contract for at least `amount` FEST beforehand.
     *
     * Gas profile (Base L2): ~46 000 gas (single SLOAD for immutable + ERC-20 transfer).
     */
    function payMerchant(
        uint256 festId,
        address merchant,
        uint256 amount
    ) external nonReentrant {
        // ── Input validation ─────────────────────────────────────────────────
        if (merchant == address(0)) revert FestPay__InvalidMerchant();
        if (amount == 0)            revert FestPay__ZeroAmount();

        // ── Token transfer ───────────────────────────────────────────────────
        // transferFrom moves FEST from student → merchant in one hop.
        // No intermediate custody; tokens never touch this contract's balance.
        bool success = festToken.transferFrom(msg.sender, merchant, amount);
        if (!success) revert FestPay__TransferFailed();

        // ── Event emission ───────────────────────────────────────────────────
        // Backend listens for this event to confirm payment and update the UI.
        emit PaymentReceived(festId, merchant, msg.sender, amount);
    }
}
