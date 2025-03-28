/**
 * Script to run storage tests
 * This script compiles the TypeScript code and runs the storage tests
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

console.log("\nRunning storage tests...");
try {
  // Use node to run the compiled JavaScript file
  execSync(
    "node -e \"require('./dist/tests/scraping-storage-test').testScrapingStorage()\"",
    { stdio: "inherit" },
  );
  console.log("\nStorage tests completed successfully");
} catch (error) {
  console.error("\nStorage tests failed:", error);
  process.exit(1);
}
