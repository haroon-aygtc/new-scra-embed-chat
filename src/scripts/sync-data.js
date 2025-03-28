/**
 * Script to synchronize data between MySQL and JSON files
 * This script compiles the TypeScript code and runs the data synchronization
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

console.log("\nSynchronizing data...");
try {
  // Use node to run the compiled JavaScript file
  execSync(
    "node -e \"require('./dist/lib/scraping/sync').syncAll().then(result => console.log('Synchronized', result.configurations, 'configurations and', result.results, 'results')).catch(error => { console.error('Error:', error); process.exit(1); })\"",
    { stdio: "inherit" },
  );
  console.log("\nData synchronization completed successfully");
} catch (error) {
  console.error("\nData synchronization failed:", error);
  process.exit(1);
}
