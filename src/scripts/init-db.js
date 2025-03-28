/**
 * Database initialization script
 * This script can be run directly to initialize the database
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

console.log("Running database initialization...");
try {
  // Use node to run the compiled JavaScript file
  execSync("node -e \"require('./dist/lib/db/init').initializeAllTables()\"", {
    stdio: "inherit",
  });
  console.log("Database initialization completed successfully");
} catch (error) {
  console.error("Database initialization failed:", error);
  process.exit(1);
}
