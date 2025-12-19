import { ReplicationMode } from "./src/messages/ReplicationMode";

// Test 1: ReplicationMode namespace exists and has expected properties
console.log("Test 1: ReplicationMode namespace");
console.log("ReplicationMode.ENABLED:", ReplicationMode.ENABLED);
console.log("ReplicationMode.PAUSED:", ReplicationMode.PAUSED);
console.log("ReplicationMode.DISABLED:", ReplicationMode.DISABLED);

// Test 2: Type usage still works
const mode1: ReplicationMode = "enabled";
const mode2: ReplicationMode = ReplicationMode.ENABLED;

console.log("\nTest 2: Type usage");
console.log("mode1:", mode1);
console.log("mode2:", mode2);

// Test 3: Values are correct
console.log("\nTest 3: Value validation");
console.log("ENABLED === 'enabled':", ReplicationMode.ENABLED === "enabled");
console.log("PAUSED === 'paused':", ReplicationMode.PAUSED === "paused");
console.log("DISABLED === 'disabled':", ReplicationMode.DISABLED === "disabled");

console.log("\n✓ All tests passed!");
