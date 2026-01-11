// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/twinkle/TwinkleCore.sol";
import "../src/twinkle/TwinkleEscrow.sol";

/**
 * @title RedeployEscrow
 * @notice Redeploy only TwinkleEscrow with the bug fix
 */
contract RedeployEscrow is Script {
    // Existing Sepolia addresses
    address constant TESTMNEE_PROXY = 0xF730d47c3003eCaE2608C452BCD5b0edf825e51C;
    address constant TWINKLE_CORE = 0x0DF0E3024350ea0992a7485aDbDE425a79983c09;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("========================================");
        console.log("  REDEPLOYING TWINKLE ESCROW (Bug Fix)");
        console.log("========================================");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new TwinkleEscrow with bug fix
        TwinkleEscrow escrow = new TwinkleEscrow(TWINKLE_CORE);
        console.log("TwinkleEscrow:", address(escrow));

        vm.stopBroadcast();

        console.log("");
        console.log("========================================");
        console.log("  UPDATE .env WITH NEW ADDRESS:");
        console.log("========================================");
        console.log("TWINKLE_ESCROW=", address(escrow));
    }
}
