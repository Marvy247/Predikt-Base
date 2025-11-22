// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/FrameBattles.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        FrameBattles frameBattles = new FrameBattles();

        vm.stopBroadcast();

        console.log("FrameBattles deployed at:", address(frameBattles));
    }
}
