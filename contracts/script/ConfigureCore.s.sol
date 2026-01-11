// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/twinkle/TwinkleCore.sol";

contract ConfigureCore is Script {
    address constant TWINKLE_CORE = 0x7BF61F6325E9e8DceB710aeDb817004d71908957;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        TwinkleCore core = TwinkleCore(TWINKLE_CORE);

        console.log("=== Configuring TwinkleCore ===");
        console.log("Current Treasury:", core.treasury());
        console.log("Current Fee:", core.platformFeeBps(), "bps");

        vm.startBroadcast(deployerPrivateKey);

        // Set treasury to deployer (for testing - in production this would be multi-sig)
        core.setTreasury(deployer);
        console.log("Set Treasury to:", deployer);

        // Set platform fee to 250 bps (2.5%)
        core.setPlatformFee(250);
        console.log("Set Platform Fee to: 250 bps (2.5%)");

        vm.stopBroadcast();

        console.log("\n=== Updated Configuration ===");
        console.log("Treasury:", core.treasury());
        console.log("Platform Fee:", core.platformFeeBps(), "bps");
    }
}
