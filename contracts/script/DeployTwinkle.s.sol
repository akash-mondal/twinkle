// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/twinkle/TwinkleCore.sol";
import "../src/twinkle/TwinklePay.sol";
import "../src/twinkle/TwinkleSplit.sol";
import "../src/twinkle/TwinkleEscrow.sol";
import "../src/twinkle/TwinkleSubscription.sol";

contract DeployTwinkle is Script {
    // Sepolia addresses
    address constant TESTMNEE_PROXY = 0xDEe5671FcFC26207295E4352E8bDf6785519e4EF;
    // Correct Sablier V3 Lockup address on Sepolia (verified from docs.sablier.com)
    address constant SABLIER_LOCKUP = 0x6b0307b4338f2963A62106028E3B074C2c0510DA;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("TestMNEE:", TESTMNEE_PROXY);
        console.log("Sablier V3:", SABLIER_LOCKUP);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy TwinkleCore (mnee, treasury, sablierLockup)
        TwinkleCore core = new TwinkleCore(
            TESTMNEE_PROXY,   // mnee
            deployer,         // treasury = deployer for testnet
            SABLIER_LOCKUP    // Sablier V3 Lockup
        );
        console.log("TwinkleCore deployed at:", address(core));

        // 2. Deploy TwinklePay
        TwinklePay pay = new TwinklePay(address(core));
        console.log("TwinklePay deployed at:", address(pay));

        // 3. Deploy TwinkleSplit
        TwinkleSplit split = new TwinkleSplit(address(core));
        console.log("TwinkleSplit deployed at:", address(split));

        // 4. Deploy TwinkleEscrow
        TwinkleEscrow escrow = new TwinkleEscrow(address(core));
        console.log("TwinkleEscrow deployed at:", address(escrow));

        // 5. Deploy TwinkleSubscription
        TwinkleSubscription subscription = new TwinkleSubscription(address(core));
        console.log("TwinkleSubscription deployed at:", address(subscription));

        // 6. Register contracts in TwinkleCore
        core.registerContract(keccak256("TwinklePay"), address(pay));
        core.registerContract(keccak256("TwinkleSplit"), address(split));
        core.registerContract(keccak256("TwinkleEscrow"), address(escrow));
        core.registerContract(keccak256("TwinkleSubscription"), address(subscription));

        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("TwinkleCore:", address(core));
        console.log("TwinklePay:", address(pay));
        console.log("TwinkleSplit:", address(split));
        console.log("TwinkleEscrow:", address(escrow));
        console.log("TwinkleSubscription:", address(subscription));

        vm.stopBroadcast();
    }
}
