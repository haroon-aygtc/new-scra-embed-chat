import { ScrapingConfig, ScrapingResult } from "@/types/scraping";

// In-memory storage for development
// In production, this would be replaced with a proper database or file system
const resultsStore: Record<string, ScrapingResult> = {};
const configsStore: Record<string, ScrapingConfig> = {};

/**
 * Saves a scraping result
 */
export async function saveScrapingResult(
  result: ScrapingResult,
): Promise<ScrapingResult> {
  try {
    // In production, this would save to a database or file system
    // For this implementation, we'll save to in-memory storage

    // Update timestamps
    result.updatedAt = new Date().toISOString();

    // Save to storage
    resultsStore[result.id] = result;

    // In production, we would also save a versioned JSON file
    await saveVersionedJsonFile(result);

    return result;
  } catch (error) {
    console.error("Error saving scraping result:", error);
    throw error;
  }
}

/**
 * Retrieves scraping results
 */
export async function getScrapingResults(
  limit = 10,
  offset = 0,
): Promise<ScrapingResult[]> {
  try {
    // In production, this would query a database or file system
    // For this implementation, we'll retrieve from in-memory storage

    const results = Object.values(resultsStore)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(offset, offset + limit);

    return results;
  } catch (error) {
    console.error("Error retrieving scraping results:", error);
    throw error;
  }
}

/**
 * Retrieves a specific scraping result by ID
 */
export async function getScrapingResultById(
  id: string,
): Promise<ScrapingResult | null> {
  try {
    // In production, this would query a database or file system
    // For this implementation, we'll retrieve from in-memory storage

    return resultsStore[id] || null;
  } catch (error) {
    console.error("Error retrieving scraping result:", error);
    throw error;
  }
}

/**
 * Saves a scraping configuration
 */
export async function saveScrapingConfig(
  config: ScrapingConfig,
): Promise<ScrapingConfig> {
  try {
    // In production, this would save to a database or file system
    // For this implementation, we'll save to in-memory storage

    // Update timestamps
    config.updatedAt = new Date().toISOString();

    if (!config.id) {
      config.id = generateConfigId();
      config.createdAt = config.updatedAt;
    }

    // Save to storage
    configsStore[config.id] = config;

    return config;
  } catch (error) {
    console.error("Error saving scraping configuration:", error);
    throw error;
  }
}

/**
 * Retrieves scraping configurations
 */
export async function getScrapingConfigs(
  limit = 10,
  offset = 0,
): Promise<ScrapingConfig[]> {
  try {
    // In production, this would query a database or file system
    // For this implementation, we'll retrieve from in-memory storage

    const configs = Object.values(configsStore)
      .sort(
        (a, b) =>
          new Date(b.createdAt || "").getTime() -
          new Date(a.createdAt || "").getTime(),
      )
      .slice(offset, offset + limit);

    return configs;
  } catch (error) {
    console.error("Error retrieving scraping configurations:", error);
    throw error;
  }
}

/**
 * Saves a versioned JSON file
 */
async function saveVersionedJsonFile(result: ScrapingResult): Promise<void> {
  try {
    // In production, this would save to a file system
    // For this implementation, we'll use localStorage in the browser if available
    // or just log to console in Node.js environment

    console.log(`Saving versioned JSON file for result ${result.id}`);

    // Create a versioned filename
    const versionedFilename = `${result.id}_${result.metadata?.version || "1.0.0"}_${result.timestamp.replace(/:/g, "-")}.json`;

    // Try to use localStorage in browser environments
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        // Store the result in localStorage with a prefix to identify scraping results
        const storageKey = `scraping_result_${result.id}`;

        // Store metadata about all versions
        const versionsKey = `scraping_versions_${result.id}`;
        const existingVersions = JSON.parse(
          localStorage.getItem(versionsKey) || "[]",
        );
        existingVersions.push({
          filename: versionedFilename,
          timestamp: result.timestamp,
          version: result.metadata?.version || "1.0.0",
        });

        // Store the actual result and the versions metadata
        localStorage.setItem(storageKey, JSON.stringify(result));
        localStorage.setItem(versionsKey, JSON.stringify(existingVersions));

        console.log(`Saved result to localStorage with key ${storageKey}`);
      } catch (storageError) {
        console.warn(
          "Failed to save to localStorage, possibly due to quota exceeded:",
          storageError,
        );
      }
    }

    // In a production environment with Node.js, we would use the file system
    // For example:
    // const fs = require('fs');
    // const path = require('path');
    // const dir = path.join(process.cwd(), 'data', 'scraping', result.id);
    // fs.mkdirSync(dir, { recursive: true });
    // fs.writeFileSync(
    //   path.join(dir, versionedFilename),
    //   JSON.stringify(result, null, 2)
    // );

    return;
  } catch (error) {
    console.error("Error saving versioned JSON file:", error);
    throw error;
  }
}

/**
 * Generates a unique configuration ID
 */
function generateConfigId(): string {
  return `config_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
