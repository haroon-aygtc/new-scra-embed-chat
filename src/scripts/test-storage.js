/**
 * Test script for storage implementation
 * This script tests the MySQL and JSON file storage functionality
 */

const { execSync } = require("child_process");

console.log("Compiling TypeScript...");
try {
  execSync("npx tsc --project tsconfig.json", { stdio: "inherit" });
  console.log("TypeScript compilation successful");
} catch (error) {
  console.error("TypeScript compilation failed:", error);
  process.exit(1);
}

console.log("Running storage tests...");
try {
  // Use node to run the test script
  execSync(
    "node -e \"require('./dist/scripts/storage-test').runStorageTests()\"",
    { stdio: "inherit" },
  );
  console.log("Storage tests completed successfully");
} catch (error) {
  console.error("Storage tests failed:", error);
  process.exit(1);
}
