import fs from "fs-extra";
import path from "path";
import { ScrapingConfig, ScrapingResult } from "@/types/scraping";

// Define paths for file storage
const DATA_DIR = path.join(process.cwd(), "data");
const CONFIGS_DIR = path.join(DATA_DIR, "configurations");
const RESULTS_DIR = path.join(DATA_DIR, "results");

/**
 * Initialize the file storage system by creating necessary directories
 */
export async function initializeFileStorage() {
  try {
    // Ensure data directories exist
    await fs.ensureDir(DATA_DIR);
    await fs.ensureDir(CONFIGS_DIR);
    await fs.ensureDir(RESULTS_DIR);
    console.log("File storage initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing file storage:", error);
    // Don't throw, just return false to indicate failure
    return false;
  }
}

/**
 * Save a scraping configuration to a file
 * @param config Scraping configuration to save
 * @returns The saved configuration with updated timestamps
 */
export async function saveConfigToFile(
  config: ScrapingConfig,
): Promise<ScrapingConfig> {
  try {
    // Ensure the config has an ID
    if (!config.id) {
      config.id = `config_${Date.now()}`;
    }

    // Set timestamps
    const now = new Date().toISOString();
    if (!config.createdAt) {
      config.createdAt = now;
    }
    config.updatedAt = now;

    // Save to file
    const filePath = path.join(CONFIGS_DIR, `${config.id}.json`);
    await fs.writeJson(filePath, config, { spaces: 2 });
    return config;
  } catch (error) {
    console.error("Error saving configuration to file:", error);
    throw error;
  }
}

/**
 * Load a scraping configuration from a file
 * @param configId ID of the configuration to load
 * @returns The loaded configuration or null if not found
 */
export async function loadConfigFromFile(
  configId: string,
): Promise<ScrapingConfig | null> {
  try {
    const filePath = path.join(CONFIGS_DIR, `${configId}.json`);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  } catch (error) {
    console.error("Error loading configuration from file:", error);
    return null;
  }
}

/**
 * Load all scraping configurations from files
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Array of configurations
 */
export async function loadAllConfigsFromFiles(
  limit?: number,
  offset = 0,
): Promise<ScrapingConfig[]> {
  try {
    // Check if directory exists first
    if (!(await fs.pathExists(CONFIGS_DIR))) {
      console.log(
        `Configs directory ${CONFIGS_DIR} does not exist, creating it`,
      );
      await fs.ensureDir(CONFIGS_DIR);
      return [];
    }

    // Get all configuration files
    const files = await fs.readdir(CONFIGS_DIR);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    // Apply pagination if specified
    const paginatedFiles = limit
      ? jsonFiles.slice(offset, offset + limit)
      : jsonFiles;

    // Load each configuration
    const configs = await Promise.all(
      paginatedFiles.map(async (file) => {
        const filePath = path.join(CONFIGS_DIR, file);
        return await fs.readJson(filePath);
      }),
    );

    // Sort by updatedAt in descending order (newest first)
    return configs.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error loading configurations from files:", error);
    return [];
  }
}

/**
 * Delete a scraping configuration file
 * @param configId ID of the configuration to delete
 * @returns True if deleted successfully, false otherwise
 */
export async function deleteConfigFile(configId: string): Promise<boolean> {
  try {
    const filePath = path.join(CONFIGS_DIR, `${configId}.json`);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting config file ${configId}:`, error);
    return false;
  }
}

/**
 * Save a scraping result to a file
 * @param result Scraping result to save
 * @returns The saved result with updated timestamps
 */
export async function saveResultToFile(
  result: ScrapingResult,
): Promise<ScrapingResult> {
  try {
    // Ensure the result has an ID
    if (!result.id) {
      result.id = `result_${Date.now()}`;
    }

    // Set timestamps
    const now = new Date().toISOString();
    if (!result.createdAt) {
      result.createdAt = now;
    }
    result.updatedAt = now;

    // Save to file
    const filePath = path.join(RESULTS_DIR, `${result.id}.json`);
    await fs.writeJson(filePath, result, { spaces: 2 });
    return result;
  } catch (error) {
    console.error("Error saving result to file:", error);
    throw error;
  }
}

/**
 * Load a scraping result from a file
 * @param resultId ID of the result to load
 * @returns The loaded result or null if not found
 */
export async function loadResultFromFile(
  resultId: string,
): Promise<ScrapingResult | null> {
  try {
    const filePath = path.join(RESULTS_DIR, `${resultId}.json`);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  } catch (error) {
    console.error("Error loading result from file:", error);
    return null;
  }
}

/**
 * Load all scraping results from files
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Array of results
 */
export async function loadAllResultsFromFiles(
  limit?: number,
  offset = 0,
): Promise<ScrapingResult[]> {
  try {
    // Check if directory exists first
    if (!(await fs.pathExists(RESULTS_DIR))) {
      console.log(
        `Results directory ${RESULTS_DIR} does not exist, creating it`,
      );
      await fs.ensureDir(RESULTS_DIR);
      return [];
    }

    // Get all result files
    const files = await fs.readdir(RESULTS_DIR);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    // Apply pagination if specified
    const paginatedFiles = limit
      ? jsonFiles.slice(offset, offset + limit)
      : jsonFiles;

    // Load each result
    const results = await Promise.all(
      paginatedFiles.map(async (file) => {
        const filePath = path.join(RESULTS_DIR, file);
        return await fs.readJson(filePath);
      }),
    );

    // Sort by timestamp in descending order (newest first)
    return results.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const dateB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error loading results from files:", error);
    return [];
  }
}

/**
 * Delete a scraping result file
 * @param resultId ID of the result to delete
 * @returns True if deleted successfully, false otherwise
 */
export async function deleteResultFile(resultId: string): Promise<boolean> {
  try {
    const filePath = path.join(RESULTS_DIR, `${resultId}.json`);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting result file ${resultId}:`, error);
    return false;
  }
}

// Initialize file storage when this module is imported
// Wrap in try/catch to prevent unhandled promise rejection
try {
  initializeFileStorage().catch((error) => {
    console.error("Error initializing file storage:", error);
  });
} catch (error) {
  console.error("Unexpected error during file storage initialization:", error);
}
