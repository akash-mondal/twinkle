// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC3009
 * @notice Interface for EIP-3009: Transfer With Authorization
 * @dev Enables gasless, meta-transaction style transfers using EIP-712 signatures
 *
 * EIP-3009 allows a token holder to sign a message authorizing a transfer,
 * which can then be submitted by any relayer. This is key for x402 protocol
 * where AI agents can authorize payments that facilitators settle on-chain.
 *
 * Key functions:
 * - transferWithAuthorization: Execute transfer with signed authorization
 * - receiveWithAuthorization: Receive funds with authorization (payee submits)
 * - authorizationState: Check if nonce has been used
 *
 * MNEE stablecoin uses a similar pattern via its SigningLibrary for
 * multi-sig operations, though exact EIP-3009 compliance may vary.
 */
interface IERC3009 {
    /**
     * @notice Execute a transfer with a signed authorization
     * @param from Payer's address (authorizer)
     * @param to Payee's address
     * @param value Amount to transfer
     * @param validAfter Authorization is valid after this timestamp
     * @param validBefore Authorization expires at this timestamp
     * @param nonce Unique nonce to prevent replay attacks
     * @param v ECDSA signature parameter v
     * @param r ECDSA signature parameter r
     * @param s ECDSA signature parameter s
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @notice Receive a transfer with a signed authorization from the payer
     * @dev Payee submits this to receive funds authorized by payer
     * @param from Payer's address (authorizer)
     * @param to Payee's address (must be msg.sender)
     * @param value Amount to transfer
     * @param validAfter Authorization is valid after this timestamp
     * @param validBefore Authorization expires at this timestamp
     * @param nonce Unique nonce to prevent replay attacks
     * @param v ECDSA signature parameter v
     * @param r ECDSA signature parameter r
     * @param s ECDSA signature parameter s
     */
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @notice Cancel an authorization
     * @dev Marks the nonce as used without executing a transfer
     * @param authorizer Address of the authorizer
     * @param nonce Nonce of the authorization to cancel
     * @param v ECDSA signature parameter v
     * @param r ECDSA signature parameter r
     * @param s ECDSA signature parameter s
     */
    function cancelAuthorization(
        address authorizer,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @notice Check if an authorization nonce has been used
     * @param authorizer Address of the authorizer
     * @param nonce Nonce to check
     * @return True if the nonce has been used (authorization executed or cancelled)
     */
    function authorizationState(
        address authorizer,
        bytes32 nonce
    ) external view returns (bool);

    /**
     * @notice Returns the EIP-712 domain separator
     * @return The domain separator bytes32 hash
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32);

    // ============ Events ============

    /**
     * @notice Emitted when an authorization is executed
     * @param from Payer address
     * @param to Payee address
     * @param value Transfer amount
     * @param nonce Authorization nonce
     */
    event AuthorizationUsed(
        address indexed from,
        address indexed to,
        uint256 value,
        bytes32 indexed nonce
    );

    /**
     * @notice Emitted when an authorization is cancelled
     * @param authorizer Address that cancelled
     * @param nonce Cancelled nonce
     */
    event AuthorizationCanceled(
        address indexed authorizer,
        bytes32 indexed nonce
    );
}

/**
 * @title IERC3009Permit
 * @notice Extended interface including EIP-2612 permit for compatibility
 * @dev Some tokens support both EIP-3009 and EIP-2612
 */
interface IERC3009Permit is IERC3009 {
    /**
     * @notice EIP-2612 permit for approvals via signature
     * @param owner Token owner
     * @param spender Address to approve
     * @param value Amount to approve
     * @param deadline Signature expiry timestamp
     * @param v ECDSA v
     * @param r ECDSA r
     * @param s ECDSA s
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @notice Current nonce for EIP-2612 permit
     * @param owner Token owner
     * @return Current nonce
     */
    function nonces(address owner) external view returns (uint256);
}

/**
 * @title EIP3009TypeHashes
 * @notice Type hash constants for EIP-3009 signature verification
 * @dev Use these for manual signature verification if needed
 */
library EIP3009TypeHashes {
    /// @notice EIP-712 typehash for TransferWithAuthorization
    bytes32 public constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH = keccak256(
        "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
    );

    /// @notice EIP-712 typehash for ReceiveWithAuthorization
    bytes32 public constant RECEIVE_WITH_AUTHORIZATION_TYPEHASH = keccak256(
        "ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
    );

    /// @notice EIP-712 typehash for CancelAuthorization
    bytes32 public constant CANCEL_AUTHORIZATION_TYPEHASH = keccak256(
        "CancelAuthorization(address authorizer,bytes32 nonce)"
    );

    /**
     * @notice Compute the EIP-712 digest for TransferWithAuthorization
     * @param domainSeparator The domain separator of the token
     * @param from Payer address
     * @param to Payee address
     * @param value Transfer amount
     * @param validAfter Valid after timestamp
     * @param validBefore Valid before timestamp
     * @param nonce Authorization nonce
     * @return digest The EIP-712 digest to sign
     */
    function getTransferAuthorizationDigest(
        bytes32 domainSeparator,
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce
    ) internal pure returns (bytes32 digest) {
        bytes32 structHash = keccak256(
            abi.encode(
                TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
                from,
                to,
                value,
                validAfter,
                validBefore,
                nonce
            )
        );

        digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );
    }
}
