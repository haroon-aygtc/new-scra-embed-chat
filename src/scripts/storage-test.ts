/**
 * Storage test module
 * Tests the MySQL and JSON file storage functionality
 */

import { ScrapingConfig, ScrapingResult } from "@/types/scraping";
import {
  saveScrapingConfig,
  getScrapingConfigs,
  getScrapingConfigById,
  deleteScrapingConfig,
  saveScrapingResult,
  getScrapingResults,
  getScrapingResultById,
  deleteScrapingResult,
} from "@/lib/scraping/storage";
import { generateUniqueId } from "@/lib/utils/ids";
import { initializeDatabase } from "@/lib/db/mysql";
import { initializeFileStorage } from "@/lib/db/fileStorage";
import { initializeAllTables } from "@/lib/db/init";

/**
 * Run storage tests
 */
export async function runStorageTests() {
  try {
    console.log("Initializing database and file storage...");
    await initializeDatabase();
    await initializeAllTables();
    await initializeFileStorage();

    console.log("\n--- Testing Configuration Storage ---");
    await testConfigStorage();

    console.log("\n--- Testing Result Storage ---");
    await testResultStorage();

    console.log("\nAll storage tests passed!");
  } catch (error) {
    console.error("Storage test error:", error);
    process.exit(1);
  }
}

/**
 * Test configuration storage
 */
async function testConfigStorage() {
  // Create a test configuration
  const testConfig: ScrapingConfig = {
    url: "https://example.com",
    mode: "single",
    scrapingMode: "basic",
    selector: ".content",
    selectorType: "css",
    categories: ["services", "fees"],
    options: {
      handleDynamicContent: true,
      followPagination: false,
      extractImages: true,
    },
    outputFormat: "json",
  };

  console.log("Saving test configuration...");
  const savedConfig = await saveScrapingConfig(testConfig);
  console.log(`Configuration saved with ID: ${savedConfig.id}`);

  console.log("Retrieving all configurations...");
  const allConfigs = await getScrapingConfigs();
  console.log(`Retrieved ${allConfigs.length} configurations`);

  console.log("Retrieving configuration by ID...");
  const retrievedConfig = await getScrapingConfigById(savedConfig.id);
  console.log(`Retrieved configuration: ${retrievedConfig?.id}`);

  if (!retrievedConfig) {
    throw new Error("Failed to retrieve configuration by ID");
  }

  console.log("Updating configuration...");
  retrievedConfig.name = "Updated Test Config";
  const updatedConfig = await saveScrapingConfig(retrievedConfig);
  console.log(`Updated configuration: ${updatedConfig.name}`);

  console.log("Deleting configuration...");
  const deleteResult = await deleteScrapingConfig(savedConfig.id);
  console.log(`Configuration deleted: ${deleteResult}`);

  // Verify deletion
  const deletedConfig = await getScrapingConfigById(savedConfig.id);
  if (deletedConfig) {
    throw new Error("Configuration was not properly deleted");
  }
  console.log("Configuration deletion verified");
}

/**
 * Test result storage
 */
async function testResultStorage() {
  // Create a test result
  const testResult: ScrapingResult = {
    id: generateUniqueId(),
    configId: "test-config-id",
    url: "https://example.com",
    timestamp: new Date().toISOString(),
    status: "success",
    categories: {
      services: {
        description: "Services offered",
        items: [
          {
            id: generateUniqueId(),
            title: "Test Service",
            content: "This is a test service",
            confidence: 0.9,
            verified: false,
            source: "https://example.com",
            metadata: {
              extractionMethod: "test",
              timestamp: new Date().toISOString(),
            },
          },
        ],
        metadata: {
          processingTime: 100,
          confidence: 0.9,
          extractionMethod: "test",
          itemCount: 1,
        },
      },
    },
    raw: {
      text: "Test content",
      html: "<html><body>Test content</body></html>",
    },
    metadata: {
      processingTime: 100,
      version: "1.0.0",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log("Saving test result...");
  const savedResult = await saveScrapingResult(testResult);
  console.log(`Result saved with ID: ${savedResult.id}`);

  console.log("Retrieving all results...");
  const allResults = await getScrapingResults();
  console.log(`Retrieved ${allResults.length} results`);

  console.log("Retrieving result by ID...");
  const retrievedResult = await getScrapingResultById(savedResult.id);
  console.log(`Retrieved result: ${retrievedResult?.id}`);

  if (!retrievedResult) {
    throw new Error("Failed to retrieve result by ID");
  }

  console.log("Updating result...");
  retrievedResult.status = "updated";
  const updatedResult = await saveScrapingResult(retrievedResult);
  console.log(`Updated result status: ${updatedResult.status}`);

  console.log("Deleting result...");
  const deleteResult = await deleteScrapingResult(savedResult.id);
  console.log(`Result deleted: ${deleteResult}`);

  // Verify deletion
  const deletedResult = await getScrapingResultById(savedResult.id);
  if (deletedResult) {
    throw new Error("Result was not properly deleted");
  }
  console.log("Result deletion verified");
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runStorageTests()
    .then(() => {
      console.log("Storage tests completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Unhandled error during storage tests:", error);
      process.exit(1);
    });
}
