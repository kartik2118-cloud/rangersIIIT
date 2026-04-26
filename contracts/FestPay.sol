// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./FestRegistry.sol";

/**
 * @title FestPay
 * @notice Processes payments from student wallets to fest merchants using FEST tokens.
 */
contract FestPay {
    IERC20 public festToken;
    FestRegistry public registry;

    event PaymentProcessed(
        bytes32 indexed festId,
        bytes32 indexed merchantId,
        address indexed student,
        uint256 amount,
        bytes32 orderRef
    );

    constructor(address _festToken, address _registry) {
        festToken = IERC20(_festToken);
        registry = FestRegistry(_registry);
    }

    /**
     * @notice Pay a merchant at a fest using FEST tokens.
     * @param festId     The festival identifier.
     * @param merchantId The merchant identifier within the fest.
     * @param amount     Amount of FEST tokens to pay.
     * @param orderRef   Unique order reference for this payment.
     */
    function pay(
        bytes32 festId,
        bytes32 merchantId,
        uint256 amount,
        bytes32 orderRef
    ) external {
        require(amount > 0, "Amount must be > 0");
        require(registry.isMerchantActive(festId, merchantId), "Merchant not active");

        address merchantWallet = registry.getMerchantWallet(festId, merchantId);
        require(merchantWallet != address(0), "Invalid merchant wallet");

        // Transfer FEST from student to merchant
        bool success = festToken.transferFrom(msg.sender, merchantWallet, amount);
        require(success, "Transfer failed");

        emit PaymentProcessed(festId, merchantId, msg.sender, amount, orderRef);
    }
}
