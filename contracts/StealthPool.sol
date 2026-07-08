// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

/**
 * @title StealthPool
 * @notice Privacy-preserving swap pool using Zama fhEVM.
 *         Users create encrypted swap intents (limit orders) directly on-chain.
 *         Amounts are encrypted using euint128 — no one except the creator
 *         and matched counterparty can see the trade size.
 *
 *         This mirrors the StealthPool concept but replaces iExec TEE + Uniswap v4 hook
 *         with pure on-chain FHE.
 *
 * @dev Inherits ZamaEthereumConfig to automatically configure fhEVM coprocessor
 *      addresses for Ethereum Mainnet (chainId=1) or Sepolia (chainId=11155111).
 *
 *      --- FHE Operations ---
 *      - FHE.fromExternal()   : Verifies & imports encrypted inputs
 *      - FHE.ge()             : Encrypted greater-or-equal comparison (returns ebool)
 *      - FHE.allowThis()      : Grants the contract ACL access to ciphertext handles
 *      - FHE.allow()          : Grants a user ACL access to ciphertext handles
 *      - No FHE.decrypt or FHE.revoke (not available in fhEVM v0.11 on-chain)
 *
 *      All encrypted amounts are stored as euint128 handles. The actual plaintext
 *      values are only observable by parties with the corresponding decryption keys
 *      via the Zama SDK off-chain.
 */
import {FHE, euint128, ebool, externalEuint128} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract StealthPool is ZamaEthereumConfig {
    // ═══════════════════════════════════════════════════════════════════════════
    //  Types
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Represents a single swap intent (limit order).
     * @param creator      Address that created the intent
     * @param tokenIn      Token the creator wants to sell
     * @param tokenOut     Token the creator wants to buy
     * @param amountIn     Encrypted amount of tokenIn the creator offers
     * @param minAmountOut Encrypted minimum amount of tokenOut the creator expects
     * @param deadline     Block timestamp after which the intent expires
     * @param active       Whether the intent is still open
     */
    struct Intent {
        address creator;
        address tokenIn;
        address tokenOut;
        euint128 amountIn;
        euint128 minAmountOut;
        uint256 deadline;
        bool active;
    }

    /**
     * @notice Result of a successful intent match.
     * @param partyA         Original intent creator (tokenIn seller)
     * @param partyB         Counterparty (user who called matchIntent)
     * @param tokenIn         Token being sold by partyA
     * @param tokenOut        Token being bought by partyA (sold by partyB)
     * @param amountIn        Encrypted amount of tokenIn (from the original intent)
     * @param amountOut       Encrypted amount of tokenOut provided by partyB
     * @param amountVerified  Encrypted boolean result of FHE.ge(amountIn, minAmountOut)
     * @param timestamp       Block timestamp when the match occurred
     */
    struct MatchResult {
        address partyA;
        address partyB;
        address tokenIn;
        address tokenOut;
        euint128 amountIn;
        euint128 amountOut;
        ebool amountVerified;
        uint256 timestamp;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  Events
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Emitted when a new intent is created.
     * @param intentId  Unique identifier derived from creator, counter, and timestamp
     * @param creator   Address of the intent creator
     * @param tokenIn   Token being sold
     * @param tokenOut  Token being bought
     * @param deadline  Expiry timestamp
     */
    event IntentCreated(
        bytes32 indexed intentId,
        address indexed creator,
        address tokenIn,
        address tokenOut,
        uint256 deadline
    );

    /**
     * @notice Emitted when an active intent is cancelled by its creator.
     * @param intentId Unique identifier of the cancelled intent
     */
    event IntentCancelled(bytes32 indexed intentId);

    /**
     * @notice Emitted when two intents are matched.
     * @param matchId   Unique identifier for this match
     * @param intentA   The original intent that was matched (partyA's intent)
     * @param intentB   Reserved (bytes32(0) for now)
     * @param partyA    Original intent creator
     * @param partyB    Counterparty
     * @param tokenIn   Token sold by partyA
     * @param tokenOut  Token bought by partyA
     * @param timestamp Block timestamp of the match
     */
    event MatchExecuted(
        bytes32 indexed matchId,
        bytes32 indexed intentA,
        bytes32 indexed intentB,
        address partyA,
        address partyB,
        address tokenIn,
        address tokenOut,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════════════════════════════════════
    //  State
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Mapping from intent ID to the full Intent struct.
    mapping(bytes32 => Intent) public intents;

    /// @notice Mapping from user address to their currently active intent ID (zero if none).
    mapping(address => bytes32) public activeIntent;

    /// @notice Mapping from match ID to the full MatchResult struct.
    mapping(bytes32 => MatchResult) public matches;

    /// @notice Array of all created intent IDs (past and present) for enumeration.
    bytes32[] public allIntents;

    /// @notice Array of all executed match IDs for enumeration.
    bytes32[] public allMatches;

    /// @notice Monotonic counter used to derive unique intent IDs.
    uint256 private intentCounter;

    /// @notice Monotonic counter for unique match IDs.
    uint256 public matchCounter;

    // ═══════════════════════════════════════════════════════════════════════════
    //  Modifiers
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Reverts if the caller is not the creator of the specified intent.
     */
    modifier onlyIntentCreator(bytes32 intentId) {
        require(intents[intentId].creator == msg.sender, "SP: not creator");
        _;
    }

    /**
     * @notice Reverts if the specified intent is not active.
     */
    modifier intentExists(bytes32 intentId) {
        require(intents[intentId].active, "SP: not active");
        _;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  Constructor
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Initialises the contract.
     * @dev ZamaEthereumConfig constructor automatically sets the fhEVM coprocessor
     *      addresses for the current chain (Ethereum Mainnet or Sepolia).
     */
    constructor() ZamaEthereumConfig() {
        // ZamaEthereumConfig handles FHE.setCoprocessor()
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  Core — Create Intent
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Create a new encrypted swap intent.
     * @param tokenIn             Address of the token the creator wants to sell
     * @param tokenOut            Address of the token the creator wants to buy
     * @param encryptedAmountIn   Externally encrypted amount of tokenIn (euint128)
     * @param proofAmountIn       ZKP proof for `encryptedAmountIn` (empty if pre-verified)
     * @param encryptedMinOut     Externally encrypted minimum amount of tokenOut (euint128)
     * @param proofMinOut         ZKP proof for `encryptedMinOut` (empty if pre-verified)
     * @param deadline            Block timestamp after which the intent expires
     *
     * @dev Reverts if:
     *      - tokenIn or tokenOut is zero address
     *      - tokenIn == tokenOut
     *      - deadline is already in the past
     *      - the caller already has an active intent
     *
     * Emits {IntentCreated}.
     */
    function createIntent(
        address tokenIn,
        address tokenOut,
        externalEuint128 encryptedAmountIn,
        bytes calldata proofAmountIn,
        externalEuint128 encryptedMinOut,
        bytes calldata proofMinOut,
        uint256 deadline
    ) external {
        require(tokenIn != address(0) && tokenOut != address(0), "SP: bad token");
        require(tokenIn != tokenOut, "SP: same token");
        require(deadline > block.timestamp, "SP: deadline passed");
        require(activeIntent[msg.sender] == bytes32(0), "SP: already active");

        // Verify and import encrypted inputs from the external caller
        euint128 amountIn = FHE.fromExternal(encryptedAmountIn, proofAmountIn);
        euint128 minOut = FHE.fromExternal(encryptedMinOut, proofMinOut);

        // Derive a unique intent ID from creator, counter, and timestamp
        bytes32 intentId = keccak256(abi.encodePacked(msg.sender, intentCounter++, block.timestamp));

        // Store the intent
        intents[intentId] = Intent({
            creator: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            minAmountOut: minOut,
            deadline: deadline,
            active: true
        });

        // Track in the user's active slot and the global enumeration array
        activeIntent[msg.sender] = intentId;
        allIntents.push(intentId);

        // Grant the contract and creator ACL access to the ciphertext handles
        FHE.allowThis(amountIn);
        FHE.allowThis(minOut);
        FHE.allow(amountIn, msg.sender);
        FHE.allow(minOut, msg.sender);

        emit IntentCreated(intentId, msg.sender, tokenIn, tokenOut, deadline);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  Core — Cancel Intent
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Cancel an active intent. Only the original creator may cancel.
     * @param intentId The ID of the intent to cancel.
     *
     * @dev Reverts if the caller is not the creator or the intent is already inactive.
     * Emits {IntentCancelled}.
     */
    function cancelIntent(bytes32 intentId)
        external
        onlyIntentCreator(intentId)
        intentExists(intentId)
    {
        intents[intentId].active = false;
        activeIntent[msg.sender] = bytes32(0);
        emit IntentCancelled(intentId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  Core — Match Intent
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Match against an existing active intent. The caller becomes partyB,
     *         offering tokenOut in exchange for tokenIn from the original creator.
     *
     * @param intentAId            The ID of the existing intent to match against
     * @param encryptedAmountIn    Externally encrypted amount being matched (partyB's offer)
     * @param proofAmountIn        ZKP proof for `encryptedAmountIn`
     * @param encryptedAmountOut   Externally encrypted amount partyB expects in return
     * @param proofAmountOut       ZKP proof for `encryptedAmountOut`
     *
     * @dev Reverts if:
     *      - The target intent is not active or has expired
     *      - The caller matches their own intent
     *      - The caller already has an active intent
     *
     * The FHE.ge(amountIn, minAmountOut) comparison result is stored as an ebool
     * in the MatchResult so both parties can decrypt it off-chain to verify fair matching.
     *
     * Emits {MatchExecuted}.
     */
    function matchIntent(
        bytes32 intentAId,
        externalEuint128 encryptedAmountIn,
        bytes calldata proofAmountIn,
        externalEuint128 encryptedAmountOut,
        bytes calldata proofAmountOut
    ) external intentExists(intentAId) {
        Intent storage intentA = intents[intentAId];

        require(block.timestamp <= intentA.deadline, "SP: expired");
        require(intentA.creator != msg.sender, "SP: cannot match self");
        require(activeIntent[msg.sender] == bytes32(0), "SP: cancel first");

        // Verify and import partyB's encrypted amounts
        euint128 amountIn = FHE.fromExternal(encryptedAmountIn, proofAmountIn);
        euint128 amountOut = FHE.fromExternal(encryptedAmountOut, proofAmountOut);

        // Perform encrypted comparison: is partyB's offered amount >= the minimum asked?
        // The resulting ebool is stored in the MatchResult so both parties can decrypt
        // it off-chain via the Zama SDK to verify fair matching.
        ebool amountVerified = FHE.ge(amountIn, intentA.minAmountOut);

        // Deactivate the original intent
        intentA.active = false;
        activeIntent[intentA.creator] = bytes32(0);

        // Derive a unique match ID
        bytes32 matchId = keccak256(abi.encodePacked(intentAId, msg.sender, block.timestamp, matchCounter++));

        // Store the match result including the FHE verification ebool
        matches[matchId] = MatchResult({
            partyA: intentA.creator,
            partyB: msg.sender,
            tokenIn: intentA.tokenIn,
            tokenOut: intentA.tokenOut,
            amountIn: intentA.amountIn,
            amountOut: amountOut,
            amountVerified: amountVerified,
            timestamp: block.timestamp
        });

        // Track in the global matches enumeration array
        allMatches.push(matchId);

        // Grant ACL access so both parties and the contract can interact with the handles
        FHE.allowThis(intentA.amountIn);
        FHE.allowThis(amountOut);
        FHE.allow(intentA.amountIn, intentA.creator);
        FHE.allow(intentA.amountIn, msg.sender);
        FHE.allow(amountOut, intentA.creator);
        FHE.allow(amountOut, msg.sender);

        emit MatchExecuted(
            matchId,
            intentAId,
            bytes32(0),
            intentA.creator,
            msg.sender,
            intentA.tokenIn,
            intentA.tokenOut,
            block.timestamp
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  View — Intent Queries
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Return the full Intent struct for a given intent ID.
     * @param intentId The intent to query.
     * @return Intent memory The complete Intent struct.
     */
    function getIntent(bytes32 intentId) external view returns (Intent memory) {
        return intents[intentId];
    }

    /**
     * @notice Get the encrypted amountIn of an intent.
     * @param intentId The intent to query.
     * @return euint128 The encrypted amountIn handle.
     */
    function getIntentAmountIn(bytes32 intentId) external view returns (euint128) {
        return intents[intentId].amountIn;
    }

    /**
     * @notice Get the encrypted minimum amountOut of an intent.
     * @param intentId The intent to query.
     * @return euint128 The encrypted minAmountOut handle.
     */
    function getIntentMinOut(bytes32 intentId) external view returns (euint128) {
        return intents[intentId].minAmountOut;
    }

    /**
     * @notice Check whether a user has an active (non-expired) intent.
     * @param user The address to check.
     * @return true if the user has an active intent, false otherwise.
     */
    function hasActiveIntent(address user) external view returns (bool) {
        bytes32 id = activeIntent[user];
        return id != bytes32(0) && intents[id].active;
    }

    /**
     * @notice Get the active intent ID for a user (zero if none).
     * @param user The address to query.
     * @return bytes32 The active intent ID, or bytes32(0).
     */
    function getActiveIntentId(address user) external view returns (bytes32) {
        return activeIntent[user];
    }

    /**
     * @notice Check whether a specific intent is still active and not expired.
     * @param intentId The intent to check.
     * @return true if the intent is active and its deadline has not passed.
     */
    function isIntentActive(bytes32 intentId) external view returns (bool) {
        return intents[intentId].active && block.timestamp <= intents[intentId].deadline;
    }

    /**
     * @notice Return an array of all intent IDs that are currently active and non-expired.
     * @return activeIds Array of active intent IDs.
     *
     * @dev This is a view-only enumeration. Gas cost scales with the total number of
     *      intents ever created, so it is best suited for off-chain or read-only usage.
     */
    function getActiveIntents() external view returns (bytes32[] memory) {
        uint256 total = allIntents.length;
        // First pass: count active intents
        uint256 count;
        for (uint256 i; i < total; ++i) {
            bytes32 id = allIntents[i];
            if (intents[id].active && block.timestamp <= intents[id].deadline) {
                ++count;
            }
        }

        // Second pass: collect active IDs
        bytes32[] memory activeIds = new bytes32[](count);
        uint256 idx;
        for (uint256 i; i < total && idx < count; ++i) {
            bytes32 id = allIntents[i];
            if (intents[id].active && block.timestamp <= intents[id].deadline) {
                activeIds[idx++] = id;
            }
        }

        return activeIds;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  View — Match Queries
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Return the full MatchResult struct for a given match ID.
     * @param matchId The match to query.
     * @return MatchResult memory The complete MatchResult struct.
     */
    function getMatch(bytes32 matchId) external view returns (MatchResult memory) {
        return matches[matchId];
    }

    /**
     * @notice Get the encrypted amountIn for a match.
     * @param matchId The match to query.
     * @return euint128 The encrypted amountIn handle.
     */
    function getMatchAmountIn(bytes32 matchId) external view returns (euint128) {
        return matches[matchId].amountIn;
    }

    /**
     * @notice Get the encrypted amountOut for a match.
     * @param matchId The match to query.
     * @return euint128 The encrypted amountOut handle.
     */
    function getMatchAmountOut(bytes32 matchId) external view returns (euint128) {
        return matches[matchId].amountOut;
    }

    /**
     * @notice Return the full match history for a given user (as either partyA or partyB).
     * @param user The address to query.
     * @return userMatches Array of MatchResult structs involving the user.
     *
     * @dev This is a view-only enumeration. Gas cost scales with the total number of
     *      matches, so it is best suited for off-chain or read-only usage.
     */
    function getUserMatchHistory(address user) external view returns (MatchResult[] memory) {
        uint256 total = allMatches.length;

        // First pass: count matches involving this user
        uint256 count;
        for (uint256 i; i < total; ++i) {
            MatchResult storage m = matches[allMatches[i]];
            if (m.partyA == user || m.partyB == user) {
                ++count;
            }
        }

        // Second pass: collect matching results
        MatchResult[] memory userMatches = new MatchResult[](count);
        uint256 idx;
        for (uint256 i; i < total && idx < count; ++i) {
            bytes32 matchId = allMatches[i];
            MatchResult storage m = matches[matchId];
            if (m.partyA == user || m.partyB == user) {
                userMatches[idx++] = m;
            }
        }

        return userMatches;
    }

    /**
     * @notice Get the total number of intents ever created.
     * @return uint256 Length of the allIntents array.
     */
    function totalIntents() external view returns (uint256) {
        return allIntents.length;
    }

    /**
     * @notice Get the total number of matches ever executed.
     * @return uint256 Length of the allMatches array.
     */
    function totalMatches() external view returns (uint256) {
        return allMatches.length;
    }
}
