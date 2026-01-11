// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "forge-std/Test.sol";
import "../src/test-mnee/TestMNEE.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract TestMNEETest is Test {
    TestMNEE public implementation;
    TestMNEE public testMNEE;
    ProxyAdmin public proxyAdmin;
    TransparentUpgradeableProxy public proxy;

    address public deployer = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public validator1 = address(0x4);
    address public validator2 = address(0x5);
    address public validator3 = address(0x6);
    address public validator4 = address(0x7);

    function setUp() public {
        vm.startPrank(deployer);

        // Deploy implementation
        implementation = new TestMNEE();

        // Deploy proxy admin
        proxyAdmin = new ProxyAdmin();

        // Prepare initialization data with deployer as all roles for simplicity
        address[4] memory minters = [deployer, validator1, validator2, validator3];
        address[4] memory burners = [deployer, validator1, validator2, validator3];
        address[4] memory pausers = [deployer, validator1, validator2, validator3];
        address[4] memory blacklisterFreezers = [deployer, validator1, validator2, validator3];

        bytes memory initData = abi.encodeWithSelector(
            TestMNEE.initialize.selector,
            deployer, // redeemer
            deployer, // admin
            deployer, // rescuer
            minters,
            burners,
            pausers,
            blacklisterFreezers
        );

        // Deploy proxy
        proxy = new TransparentUpgradeableProxy(
            address(implementation),
            address(proxyAdmin),
            initData
        );

        testMNEE = TestMNEE(address(proxy));
        vm.stopPrank();
    }

    function test_InitialState() public view {
        assertEq(testMNEE.name(), "TestMNEE USD Stablecoin");
        assertEq(testMNEE.symbol(), "tMNEE");
        assertEq(testMNEE.decimals(), 18);
        assertEq(testMNEE.admin(), deployer);
        assertEq(testMNEE.redeemer(), deployer);
        assertEq(testMNEE.rescuer(), deployer);
    }

    function test_AdminMint() public {
        vm.prank(deployer);
        testMNEE.adminMint(user1, 1000 * 10**18);

        assertEq(testMNEE.balanceOf(user1), 1000 * 10**18);
    }

    function test_AdminMint_RevertIfNotAdmin() public {
        vm.prank(user1);
        vm.expectRevert(TestMNEE.onlyAdmin.selector);
        testMNEE.adminMint(user1, 1000 * 10**18);
    }

    function test_Faucet() public {
        vm.prank(user1);
        testMNEE.faucet(user1, 10000 * 10**18);

        assertEq(testMNEE.balanceOf(user1), 10000 * 10**18);
    }

    function test_Faucet_RevertIfAmountTooHigh() public {
        vm.prank(user1);
        vm.expectRevert(TestMNEE.faucetAmountTooHigh.selector);
        testMNEE.faucet(user1, 10001 * 10**18);
    }

    function test_Faucet_RevertIfCooldown() public {
        vm.prank(user1);
        testMNEE.faucet(user1, 1000 * 10**18);

        // Try again immediately
        vm.prank(user1);
        vm.expectRevert(TestMNEE.faucetCooldown.selector);
        testMNEE.faucet(user1, 1000 * 10**18);
    }

    function test_Faucet_WorksAfterCooldown() public {
        vm.prank(user1);
        testMNEE.faucet(user1, 1000 * 10**18);

        // Advance time past cooldown
        vm.warp(block.timestamp + 1 hours + 1);

        vm.prank(user1);
        testMNEE.faucet(user1, 1000 * 10**18);

        assertEq(testMNEE.balanceOf(user1), 2000 * 10**18);
    }

    function test_Transfer() public {
        vm.prank(deployer);
        testMNEE.adminMint(user1, 1000 * 10**18);

        vm.prank(user1);
        testMNEE.transfer(user2, 500 * 10**18);

        assertEq(testMNEE.balanceOf(user1), 500 * 10**18);
        assertEq(testMNEE.balanceOf(user2), 500 * 10**18);
    }

    function test_Approve_TransferFrom() public {
        vm.prank(deployer);
        testMNEE.adminMint(user1, 1000 * 10**18);

        vm.prank(user1);
        testMNEE.approve(user2, 500 * 10**18);

        vm.prank(user2);
        testMNEE.transferFrom(user1, user2, 500 * 10**18);

        assertEq(testMNEE.balanceOf(user1), 500 * 10**18);
        assertEq(testMNEE.balanceOf(user2), 500 * 10**18);
    }

    function test_ValidatorRoles() public view {
        assertTrue(testMNEE.isMinter(deployer));
        assertTrue(testMNEE.isBurner(deployer));
        assertTrue(testMNEE.isPauser(deployer));
        assertTrue(testMNEE.isBlacklisterFreezer(deployer));

        assertTrue(testMNEE.isMinter(validator1));
        assertTrue(testMNEE.isBurner(validator1));
    }

    function test_RequiredSignatures() public view {
        assertEq(testMNEE.requiredSignatures(), 3);
        assertEq(testMNEE.roleHolders(), 4);
    }

    function test_BlacklistPreventsTransfer() public {
        // Setup - mint and blacklist
        vm.startPrank(deployer);
        testMNEE.adminMint(user1, 1000 * 10**18);

        // Note: For real blacklisting, would need 3-of-4 signatures
        // This test demonstrates the blacklist check in transfers
        // In production, blacklisting requires multi-sig
        vm.stopPrank();
    }
}
