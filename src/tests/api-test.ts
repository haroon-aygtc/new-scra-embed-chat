/**
 * API test script
 * Tests the API routes for the scraping module
 */

import fetch from "node-fetch";
import { generateUniqueId } from "@/lib/utils/ids";

// Base URL for API requests
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

/**
 * Test the API routes
 */
export async function testApiRoutes() {
  console.log("=== Testing API Routes ===\n");

  // Test initialization
  await testInitialization();

  // Test configuration routes
  const configId = await testConfigurationRoutes();

  // Test result routes
  const resultId = await testResultRoutes(configId);

  // Test export routes
  await testExportRoutes(resultId);

  // Test synchronization routes
  await testSynchronizationRoutes();

  // Test scheduler routes
  await testSchedulerRoutes();

  console.log("\n=== All API tests completed successfully ===\n");
}

/**
 * Test initialization route
 */
async function testInitialization() {
  console.log("--- Testing Initialization Route ---");

  try {
    const response = await fetch(`${API_BASE_URL}/scraping/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ startSync: false }),
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Initialization successful:", data.message);
  } catch (error) {
    console.error("Error testing initialization route:", error);
    throw error;
  }
}

/**
 * Test configuration routes
 * @returns The ID of the created configuration
 */
async function testConfigurationRoutes(): Promise<string> {
  console.log("\n--- Testing Configuration Routes ---");

  try {
    // Create a test configuration
    const configId = generateUniqueId();
    const testConfig = {
      id: configId,
      name: "Test Configuration",
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

    // Test creating a configuration
    console.log("Creating configuration...");
    const createResponse = await fetch(`${API_BASE_URL}/scraping/configurations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testConfig),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create configuration: ${createResponse.statusText}`);
    }

    const createdConfig = await createResponse.json();
    console.log(`Configuration created with ID: ${createdConfig.id}`);

    // Test getting all configurations
    console.log("\nGetting all configurations...");
    const getAllResponse = await fetch(`${API_BASE_URL}/scraping/configurations`);

    if (!getAllResponse.ok) {
      throw new Error(`Failed to get configurations: ${getAllResponse.statusText}`);
    }

    const allConfigs = await getAllResponse.json();
    console.log(`Retrieved ${allConfigs.length} configurations`);

