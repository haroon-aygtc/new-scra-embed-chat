/**
 * Test script for scraping storage
 * Tests the functionality of the scraping storage module
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

/**
 * Test the scraping storage module
 */
export async function testScrapingStorage() {
  console.log("=== Testing Scraping Storage ===\n");

  // Test configuration storage
  await testConfigStorage();

  // Test result storage
  await testResultStorage();

  console.log("\n=== All tests completed successfully ===\n");
}

/**
 * Test configuration storage
 */
async function testConfigStorage() {
  console.log("--- Testing Configuration Storage ---");

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
      deduplicateResults: true,
      maxPages: 5,
      skipHeadersFooters: false,
      skipImagesMedia: false,
      stealthMode: true,
      respectRobotsTxt: true,
      rateLimitDelay: 1000,
    },
    outputFormat: "json",
  };

  // Save the configuration
  console.log("Saving test configuration...");
  const savedConfig = await saveScrapingConfig(testConfig);
  console.log(`Configuration saved with ID: ${savedConfig.id}`);

  // Get all configurations
  console.log("\nGetting all configurations...");
  const allConfigs = await getScrapingConfigs();
  console.log(`Retrieved ${allConfigs.length} configurations`);

  // Get configuration by ID
  console.log("\nGetting configuration by ID...");
  const retrievedConfig = await getScrapingConfigById(savedConfig.id || "");
  console.log(`Retrieved configuration: ${retrievedConfig?.id}`);

  if (!retrievedConfig) {
    throw new Error("Failed to retrieve configuration by ID");
  }

  // Update the configuration
  console.log("\nUpdating configuration...");
  retrievedConfig.name = "Updated Test Configuration";
  const updatedConfig = await saveScrapingConfig(retrievedConfig);
  console.log(`Updated configuration name: ${updatedConfig.name}`);

  // Delete the configuration
  console.log("\nDeleting configuration...");
  const deleteResult = await deleteScrapingConfig(savedConfig.id || "");
  console.log(`Configuration deleted: ${deleteResult}`);

  // Verify deletion
  console.log("\nVerifying deletion...");
  const deletedConfig = await getScrapingConfigById(savedConfig.id || "");
  if (deletedConfig) {
    throw new Error("Configuration was not properly deleted");
  }
  console.log("Configuration deletion verified");
}

/**
 * Test result storage
 */
async function testResultStorage() {
  console.log("\n--- Testing Result Storage ---");

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
            confidence: 0.