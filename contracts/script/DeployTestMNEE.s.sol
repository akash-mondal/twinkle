// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "forge-std/Script.sol";
import "../src/test-mnee/TestMNEE.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

/**
 * @title DeployTestMNEE
 * @notice Deploys TestMNEE (exact MNEE replica) to Sepolia with TransparentUpgradeableProxy
 *
 * Usage:
 * forge script script/DeployTestMNEE.s.sol:DeployTestMNEE \
 *   --rpc-url $SEPOLIA_RPC_URL \
 *   --broadcast \
 *   --verify \
 *   -vvvv
 */
contract DeployTestMNEE is Script {
    function run() external {
        // Load deployer private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying TestMNEE with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy the implementation contract
        TestMNEE implementation = new TestMNEE();
        console.log("TestMNEE Implementation deployed at:", address(implementation));

        // 2. Deploy ProxyAdmin
        ProxyAdmin proxyAdmin = new ProxyAdmin();
        console.log("ProxyAdmin deployed at:", address(proxyAdmin));

        // 3. Prepare initialization data
        // For testing, we use the deployer as all validators
        // In production, these would be different addresses for multi-sig security
        address[4] memory minters = [deployer, deployer, deployer, deployer];
        address[4] memory burners = [deployer, deployer, deployer, deployer];
        address[4] memory pausers = [deployer, deployer, deployer, deployer];
        address[4] memory blacklisterFreezers = [deployer, deployer, deployer, deployer];

        bytes memory initData = abi.encodeWithSelector(
            TestMNEE.initialize.selector,
            deployer,           // redeemer
            deployer,           // admin
            deployer,           // rescuer
            minters,
            burners,
            pausers,
            blacklisterFreezers
        );

        // 4. Deploy TransparentUpgradeableProxy
        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
            address(implementation),
            address(proxyAdmin),
            initData
        );
        console.log("TestMNEE Proxy deployed at:", address(proxy));

        // 5. Verify deployment
        TestMNEE testMNEE = TestMNEE(address(proxy));
        console.log("Token name:", testMNEE.name());
        console.log("Token symbol:", testMNEE.symbol());
        console.log("Admin:", testMNEE.admin());
        console.log("Redeemer:", testMNEE.redeemer());

        // 6. Mint initial supply to deployer for testing (1,000,000 tMNEE)
        testMNEE.adminMint(deployer, 1_000_000 * 10**18);
        console.log("Minted 1,000,000 tMNEE to deployer");
        console.log("Deployer balance:", testMNEE.balanceOf(deployer));

        vm.stopBroadcast();

        // Output deployment info
        console.log("\n========== DEPLOYMENT SUMMARY ==========");
        console.log("Network: Sepolia");
        console.log("TestMNEE Implementation:", address(implementation));
        console.log("ProxyAdmin:", address(proxyAdmin));
        console.log("TestMNEE Proxy (use this address):", address(proxy));
        console.log("=========================================\n");
    }
}
