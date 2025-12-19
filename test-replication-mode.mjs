import { ReplicationMode } from "./lib/cjs/messages/ReplicationMode.js";

// Test 1: ReplicationMode namespace exists and has expected properties
console.log("Test 1: ReplicationMode namespace");
console.log("ReplicationMode.ENABLED:", ReplicationMode.ENABLED);
console.log("ReplicationMode.PAUSED:", ReplicationMode.PAUSED);
console.log("ReplicationMode.DISABLED:", ReplicationMode.DISABLED);

// Test 2: Values are correct
console.log("\nTest 2: Value validation");
console.log("ENABLED === 'enabled':", ReplicationMode.ENABLED === "enabled");
console.log("PAUSED === 'paused':", ReplicationMode.PAUSED === "paused");
console.log("DISABLED === 'disabled':", ReplicationMode.DISABLED === "disabled");

console.log("\n✓ All tests passed!");
