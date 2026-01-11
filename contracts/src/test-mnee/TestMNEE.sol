// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./SigningLibrary.sol";

/**
 * @title TestMNEE - Exact MNEE Replica for Sepolia Testing
 * @author Twinkle (based on Monkhub Innovations MNEE v1.1)
 *
 * @notice
 *  This is an EXACT replica of the MNEE USD Stablecoin contract deployed on mainnet.
 *  The only addition is a `faucet` function for testing purposes on Sepolia.
 *  All multi-sig, blacklist, freeze, confiscate functionality is preserved exactly.
 *
 *  Mainnet MNEE: 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF (proxy)
 */
contract TestMNEE is Initializable, ERC20Upgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;

    /*════════════════════════════════ STATE ════════════════════════════════*/
    address public redeemer;
    uint8 public constant requiredSignatures = 3;
    uint8 public constant roleHolders = 4;
    address public admin;
    address public rescuer;

    mapping(address => bool) public blacklisted;
    mapping(address => bool) public frozen;
    mapping(bytes32 => bool) public instanceNonces;

    mapping(address => bool) public isMinter;
    mapping(address => bool) public isBurner;
    mapping(address => bool) public isPauser;
    mapping(address => bool) public isBlacklisterFreezer;

    enum validatorRole {
        minter,
        burner,
        pauser,
        blacklister_freezer
    }

    /* Use enum index when signing */
    enum functionType {
        mint,
        burn,
        burnHoldings,
        freeze,
        blacklist,
        delist,
        unfreeze,
        confiscate,
        pause,
        unpause,
        changeMinter,
        changeBurner,
        changePauser,
        changeBlacklisterFreezer
    }

    /*══════════════════════════════ EVENTS ════════════════════════════════*/
    event TokensMinted(address indexed account, uint256 indexed amount);
    event TokensBurnt(uint256 indexed amount);
    event HoldingsBurnt(address indexed account, uint256 indexed amount);
    event AccountFrozen(address indexed account);
    event AccountUnfrozen(address indexed account);
    event AccountBlacklisted(address indexed account);
    event AccountDelisted(address indexed account);
    event FundsConfiscated(
        address indexed account,
        uint256 indexed amount,
        address indexed sentTo
    );
    event FundsRescued(
        address indexed token,
        uint256 indexed amount,
        address indexed sentTo
    );
    event ChangeMinter(address indexed old, address indexed _new);
    event ChangeBurner(address indexed old, address indexed _new);
    event ChangePauser(address indexed old, address indexed _new);
    event ChangeBlacklisterFreezer(address indexed old, address indexed _new);
    event ChangeRedeemer(address indexed _new);
    event ChangeRescuer(address indexed _new);

    // TestMNEE-specific event
    event FaucetMint(address indexed to, uint256 amount);

    /*══════════════════════════════ ERRORS ════════════════════════════════*/
    error zeroAddress();
    error notZeroAddress();
    error onlyAdmin();
    error onlyCorrectValidator();
    error invalidSigner();
    error invalidSign();
    error neitherBLnorF();
    error blacklistedAddress();
    error frozenAddress();
    error BLorF();
    error notBL();
    error notF();
    error tokenPaused();
    error invalidAmt();
    error wrongFunction();

    /* NEW errors (byte-code only, no storage impact) */
    error oldNotValidator();
    error newAlreadyValidator();
    error burnTargetMismatch();
    error alreadyBlacklisted();

    // TestMNEE-specific errors
    error faucetCooldown();
    error faucetAmountTooHigh();

    /*════════════════════ TESTMNEE-SPECIFIC STATE ═════════════════════════*/
    uint256 public constant FAUCET_AMOUNT = 10000 * 10**18; // 10,000 TestMNEE
    uint256 public constant FAUCET_COOLDOWN = 1 hours;
    mapping(address => uint256) public lastFaucetTime;

    /*════════════════════════════ INITIALIZER ═════════════════════════════*/
    function initialize(
        address _redeemer,
        address _admin,
        address _rescuer,
        address[roleHolders] calldata _minters,
        address[roleHolders] calldata _burners,
        address[roleHolders] calldata _pausers,
        address[roleHolders] calldata _blacklisters_freezers
    ) public initializer {
        if (
            _redeemer == address(0) ||
            _rescuer == address(0) ||
            _admin == address(0)
        ) revert zeroAddress();

        redeemer = _redeemer;
        admin = _admin;
        rescuer = _rescuer;

        /* Validate array lengths match roleHolders constant */
        if (
            _minters.length != roleHolders ||
            _burners.length != roleHolders ||
            _pausers.length != roleHolders ||
            _blacklisters_freezers.length != roleHolders
        ) revert wrongFunction();

        __ERC20_init("TestMNEE USD Stablecoin", "tMNEE");

        /* Give admin every validator role */
        isMinter[_admin] = true;
        isBurner[_admin] = true;
        isPauser[_admin] = true;
        isBlacklisterFreezer[_admin] = true;

        emit ChangeMinter(address(0), _admin);
        emit ChangeBurner(address(0), _admin);
        emit ChangePauser(address(0), _admin);
        emit ChangeBlacklisterFreezer(address(0), _admin);

        /* Set initial validator sets */
        for (uint96 i = 0; i < _minters.length; i++) {
            isMinter[_minters[i]] = true;
            isBurner[_burners[i]] = true;
            isPauser[_pausers[i]] = true;
            isBlacklisterFreezer[_blacklisters_freezers[i]] = true;

            emit ChangeMinter(address(0), _minters[i]);
            emit ChangeBurner(address(0), _burners[i]);
            emit ChangePauser(address(0), _pausers[i]);
            emit ChangeBlacklisterFreezer(
                address(0),
                _blacklisters_freezers[i]
            );
        }
    }

    /*════════════════════ TESTMNEE FAUCET (SEPOLIA ONLY) ══════════════════*/
    /**
     * @notice Mint test tokens for Sepolia testing
     * @dev Rate limited to prevent abuse. Only available on testnet.
     * @param to Address to receive tokens
     * @param amount Amount to mint (max 10,000 tMNEE per call)
     */
    function faucet(address to, uint256 amount) external {
        if (to == address(0)) revert zeroAddress();
        if (amount > FAUCET_AMOUNT) revert faucetAmountTooHigh();
        // Check cooldown only if user has used faucet before
        if (lastFaucetTime[msg.sender] != 0 &&
            block.timestamp < lastFaucetTime[msg.sender] + FAUCET_COOLDOWN) {
            revert faucetCooldown();
        }
        if (blacklisted[to]) revert blacklistedAddress();

        lastFaucetTime[msg.sender] = block.timestamp;
        _mint(to, amount);
        emit FaucetMint(to, amount);
    }

    /**
     * @notice Admin can mint unlimited for testing
     * @dev Only admin can call this - useful for setting up test scenarios
     */
    function adminMint(address to, uint256 amount) external {
        if (_msgSender() != admin) revert onlyAdmin();
        if (to == address(0)) revert zeroAddress();
        if (blacklisted[to]) revert blacklistedAddress();

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /*════════════════════════════ ADMIN SETTERS ═══════════════════════════*/
    function changeRedeemer(address _newRedeemer) external {
        if (_newRedeemer == address(0)) revert zeroAddress();
        if (_msgSender() != admin) revert onlyAdmin();
        redeemer = _newRedeemer;
        emit ChangeRedeemer(_newRedeemer);
    }

    function changeRescuer(address _newrescuer) external {
        if (_newrescuer == address(0)) revert zeroAddress();
        if (_msgSender() != admin) revert onlyAdmin();
        rescuer = _newrescuer;
        emit ChangeRescuer(_newrescuer);
    }

    /*══════════════════════ VALIDATOR MANAGEMENT ════════════════════════*/
    /**
     * @dev Replaces an existing validator of a role with a new address.
     *      Requires `requiredSignatures` approvals by *current* validators
     *      of that same role.
     */
    function replaceValidator(
        address _old,
        address _new,
        functionType fType,
        address[requiredSignatures] calldata signers,
        bytes32 instanceIdentifier,
        bytes[requiredSignatures] calldata signatures
    ) external {
        /* Basic sanity guards */
        if (_new == address(0)) revert zeroAddress();
        if (_old == _new) revert wrongFunction();
        if (signers[0] == signers[2]) revert invalidSigner();
        if (instanceNonces[instanceIdentifier]) revert wrongFunction();
        instanceNonces[instanceIdentifier] = true;

        /* Role-specific presence checks */
        if (fType == functionType.changeMinter) {
            if (!isMinter[_old]) revert oldNotValidator();
            if (isMinter[_new]) revert newAlreadyValidator();
        } else if (fType == functionType.changeBurner) {
            if (!isBurner[_old]) revert oldNotValidator();
            if (isBurner[_new]) revert newAlreadyValidator();
        } else if (fType == functionType.changePauser) {
            if (!isPauser[_old]) revert oldNotValidator();
            if (isPauser[_new]) revert newAlreadyValidator();
        } else if (fType == functionType.changeBlacklisterFreezer) {
            if (!isBlacklisterFreezer[_old]) revert oldNotValidator();
            if (isBlacklisterFreezer[_new]) revert newAlreadyValidator();
        } else {
            revert wrongFunction();
        }

        /* Validate each signer */
        for (uint8 i = 0; i < requiredSignatures; i++) {
            /* Must hold correct role */
            if (fType == functionType.changeMinter) {
                if (!isMinter[signers[i]]) revert invalidSigner();
            } else if (fType == functionType.changeBurner) {
                if (!isBurner[signers[i]]) revert invalidSigner();
            } else if (fType == functionType.changePauser) {
                if (!isPauser[signers[i]]) revert invalidSigner();
            } else if (fType == functionType.changeBlacklisterFreezer) {
                if (!isBlacklisterFreezer[signers[i]]) revert invalidSigner();
            }

            /* No duplicate signers */
            for (uint8 j = 0; j < i; j++) {
                if (signers[i] == signers[j]) revert invalidSigner();
            }

            /* Signature verification */
            if (
                !SigningLibrary.verify(
                    signers[i],
                    _old,
                    _new,
                    0,
                    uint8(fType),
                    instanceIdentifier,
                    block.chainid,
                    signatures[i]
                )
            ) revert invalidSign();
        }

        /* Check if new address is blacklisted or frozen */
        if (blacklisted[_new]) revert blacklistedAddress();
        if (frozen[_new]) revert frozenAddress();

        /* Role map updates */
        if (fType == functionType.changeMinter) {
            if (!isMinter[_msgSender()]) revert onlyCorrectValidator();
            isMinter[_old] = false;
            isMinter[_new] = true;
            emit ChangeMinter(_old, _new);
        } else if (fType == functionType.changeBurner) {
            if (!isBurner[_msgSender()]) revert onlyCorrectValidator();
            isBurner[_old] = false;
            isBurner[_new] = true;
            emit ChangeBurner(_old, _new);
        } else if (fType == functionType.changePauser) {
            if (!isPauser[_msgSender()]) revert onlyCorrectValidator();
            isPauser[_old] = false;
            isPauser[_new] = true;
            emit ChangePauser(_old, _new);
        } else if (fType == functionType.changeBlacklisterFreezer) {
            if (!isBlacklisterFreezer[_msgSender()])
                revert onlyCorrectValidator();
            isBlacklisterFreezer[_old] = false;
            isBlacklisterFreezer[_new] = true;
            emit ChangeBlacklisterFreezer(_old, _new);
        }
    }

    /*═════════════════════ CORE ROLE OPERATIONS ══════════════════════════*/
    /**
     * Mint, Burn (to `redeemer`), Pause, Unpause — requires 3 valid signatures
     * from validators of the relevant role.
     */
    function mintBurnPauseUnpause(
        address _target,
        uint256 _amount,
        functionType fType,
        address[requiredSignatures] calldata signers,
        bytes[requiredSignatures] calldata signatures,
        bytes32 instanceIdentifier
    ) external {
        require(signers[0] != signers[2], "Signers must be unique");
        require(!instanceNonces[instanceIdentifier], "Invalid uuid");
        instanceNonces[instanceIdentifier] = true;

        // For burns, target must equal redeemer
        if (fType == functionType.burn) {
            if (_target != redeemer) revert burnTargetMismatch();
        }

        for (uint8 i = 0; i < requiredSignatures; i++) {
            if (fType == functionType.mint) {
                if (!(isMinter[signers[i]])) revert invalidSigner();
            } else if (fType == functionType.burn) {
                if (!(isBurner[signers[i]])) revert invalidSigner();
            } else if (
                fType == functionType.pause || fType == functionType.unpause
            ) {
                if (!(isPauser[signers[i]])) revert invalidSigner();
            }

            if (i > 0 && signers[i] == signers[i - 1]) revert invalidSigner();

            if (
                !SigningLibrary.verify(
                    signers[i],
                    _target,
                    address(0),
                    _amount,
                    uint8(fType),
                    instanceIdentifier,
                    block.chainid,
                    signatures[i]
                )
            ) revert invalidSign();
        }

        if (fType == functionType.mint) {
            if (!isMinter[_msgSender()]) revert onlyCorrectValidator();
            _mint(_target, _amount);
            emit TokensMinted(_target, _amount);
        } else if (fType == functionType.burn) {
            if (!isBurner[_msgSender()]) revert onlyCorrectValidator();
            super._burn(redeemer, _amount);
            emit TokensBurnt(_amount);
        } else if (
            fType == functionType.pause || fType == functionType.unpause
        ) {
            if (!isPauser[_msgSender()]) revert onlyCorrectValidator();
            if (fType == functionType.pause) super._pause();
            else super._unpause();
        } else {
            revert wrongFunction();
        }
    }

    /**
     * Blacklist / Freeze / Confiscate / BurnHoldings — requires 3 signatures
     * from blacklisterFreezer validators.
     */
    function blacklisterFreezerOps(
        address _address,
        address _to,
        functionType fType,
        uint256 _amount,
        address[requiredSignatures] calldata signers,
        bytes[requiredSignatures] calldata signatures,
        bytes32 instanceIdentifier
    ) external {
        require(signers[0] != signers[2], "Signers must be unique");
        require(!instanceNonces[instanceIdentifier], "Invalid uuid");
        instanceNonces[instanceIdentifier] = true;

        if (!isBlacklisterFreezer[_msgSender()]) revert onlyCorrectValidator();

        for (uint8 i = 0; i < requiredSignatures; i++) {
            if (!(isBlacklisterFreezer[signers[i]])) revert invalidSigner();
            if (i > 0 && signers[i] == signers[i - 1]) revert invalidSigner();

            if (
                !SigningLibrary.verify(
                    signers[i],
                    _address,
                    _to,
                    _amount,
                    uint8(fType),
                    instanceIdentifier,
                    block.chainid,
                    signatures[i]
                )
            ) revert invalidSign();
        }

        if (fType == functionType.burnHoldings) {
            if (!(blacklisted[_address] || frozen[_address]))
                revert neitherBLnorF();
            if (_to != address(0)) revert notZeroAddress();
            super._burn(_address, _amount);
            emit HoldingsBurnt(_address, _amount);
        } else if (fType == functionType.confiscate) {
            if (!(blacklisted[_address] || frozen[_address]))
                revert neitherBLnorF();
            if (_to == address(0)) revert zeroAddress();
            _transfer(_address, _to, _amount);
            emit FundsConfiscated(_address, _amount, _to);
        } else if (fType == functionType.blacklist) {
            if (blacklisted[_address]) revert alreadyBlacklisted();
            blacklisted[_address] = true;
            emit AccountBlacklisted(_address);
        } else if (fType == functionType.freeze) {
            if (frozen[_address]) revert BLorF();
            frozen[_address] = true;
            emit AccountFrozen(_address);
        } else if (fType == functionType.unfreeze) {
            if (!frozen[_address]) revert notF();
            frozen[_address] = false;
            emit AccountUnfrozen(_address);
        } else if (fType == functionType.delist) {
            if (!blacklisted[_address]) revert notBL();
            blacklisted[_address] = false;
            emit AccountDelisted(_address);
        } else {
            revert wrongFunction();
        }
    }

    /*════════════════════════════ TOKEN RESCUE ════════════════════════════*/
    function rescue(
        IERC20 token,
        uint256 _amount,
        address _requester
    ) external {
        if (rescuer != _msgSender()) revert onlyCorrectValidator();
        if (address(token) == address(0)) revert zeroAddress();
        if (_amount == 0) revert invalidAmt();
        if (_requester == address(0)) revert zeroAddress();

        if (blacklisted[_requester]) revert blacklistedAddress();

        token.safeTransfer(_requester, _amount);
        emit FundsRescued(address(token), _amount, _requester);
    }

    /*══════════════════ TOKEN TRANSFER HOOK ══════════════════════════════*/
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (!isBlacklisterFreezer[msg.sender]) {
            if (blacklisted[from]) revert blacklistedAddress();
            if (frozen[from]) revert frozenAddress();
        }
        if (blacklisted[to]) revert blacklistedAddress();
        if (paused()) revert tokenPaused();
        super._beforeTokenTransfer(from, to, amount);
    }

    /*══════════════════════════ VIEW FUNCTIONS ═══════════════════════════*/
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
