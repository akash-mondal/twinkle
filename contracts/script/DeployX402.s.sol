// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/twinkle/TwinkleCore.sol";
import "../src/twinkle/TwinkleX402.sol";

/**
 * @title DeployX402
 * @notice Deploys TwinkleX402 to Sepolia and registers it with TwinkleCore
 */
contract DeployX402 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address coreAddress = vm.envAddress("TWINKLE_CORE");
        address payAddress = vm.envAddress("TWINKLE_PAY");

        console.log("Deployer:", deployer);
        console.log("TwinkleCore:", coreAddress);
        console.log("TwinklePay:", payAddress);

        vm.startBroadcast(deployerPrivateKey);

        TwinkleCore core = TwinkleCore(coreAddress);

        // Deploy TwinkleX402 with deployer as facilitator
        TwinkleX402 x402 = new TwinkleX402(
            coreAddress,
            deployer,      // facilitator = deployer for testnet
            payAddress
        );
        console.log("TwinkleX402 deployed at:", address(x402));

        // Register with TwinkleCore
        core.registerContract(keccak256("TwinkleX402"), address(x402));
        console.log("TwinkleX402 registered with TwinkleCore");

        vm.stopBroadcast();

        console.log("");
        console.log("=== TwinkleX402 Deployment Complete ===");
        console.log("TwinkleX402:", address(x402));
        console.log("Add to .env: TWINKLE_X402=", address(x402));
    }
}
