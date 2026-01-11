// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/twinkle/TwinkleCore.sol";
import "../src/twinkle/TwinkleSubscription.sol";

contract RedeploySubscription is Script {
    address constant TWINKLE_CORE = 0x7BF61F6325E9e8DceB710aeDb817004d71908957;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        TwinkleCore core = TwinkleCore(TWINKLE_CORE);

        console.log("=== Redeploying TwinkleSubscription (bug fix) ===");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new TwinkleSubscription
        TwinkleSubscription subscription = new TwinkleSubscription(TWINKLE_CORE);
        console.log("New TwinkleSubscription deployed at:", address(subscription));

        // Update registry
        core.registerContract(keccak256("TwinkleSubscription"), address(subscription));
        console.log("Updated registry");

        vm.stopBroadcast();

        console.log("\n=== Updated Address ===");
        console.log("TWINKLE_SUBSCRIPTION=", address(subscription));
    }
}
