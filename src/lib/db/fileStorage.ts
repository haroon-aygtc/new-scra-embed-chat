/**
 * File storage module for scraping configurations and results
 * Handles reading and writing data to JSON files
 */

import fs from "fs-extra";
import path from "path";
import { ScrapingConfig, ScrapingResult } from "@/types/scraping";

// Define storage directories
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
  } catch (error) {
    console.error("Error initializing file storage:", error);
    throw error;
  }
}

/**
 * Save a scraping configuration to a JSON file
 * @param config The configuration to save
 * @returns The saved configuration
 */
export async function saveConfigToFile(
  config: ScrapingConfig,
): Promise<ScrapingConfig> {
  try {
    const filePath = path.join(CONFIGS_DIR, `${config.id}.json`);
    await fs.writeJson(filePath, config, { spaces: 2 });
    return config;
  } catch (error) {
    console.error(`Error saving configuration ${config.id} to file:`, error);
    throw error;
  }
}

/**
 * Load a scraping configuration from a JSON file
 * @param id The ID of the configuration to load
 * @returns The loaded configuration or null if not found
 */
export async function loadConfigFromFile(
  id: string,
): Promise<ScrapingConfig | null> {
  try {
    const filePath = path.join(CONFIGS_DIR, `${id}.json`);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  } catch (error) {
    console.error(`Error loading configuration ${id} from file:`, error);
    return null;
  }
}

/**
 * Load all scraping configurations from JSON files
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Array of configurations
 */
export async function loadAllConfigsFromFiles(
  limit?: number,
  offset = 0,
): Promise<ScrapingConfig[]> {
  try {
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
 * Delete a scraping configuration JSON file
 * @param id The ID of the configuration to delete
 * @returns True if deleted successfully, false otherwise
 */
export async function deleteConfigFile(id: string): Promise<boolean> {
  try {
    const filePath = path.join(CONFIGS_DIR, `${id}.json`);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting configuration ${id} file:`, error);
    return false;
  }
}

/**
 * Save a scraping result to a JSON file
 * @param result The result to save
 * @returns The saved result
 */
export async function saveResultToFile(
  result: ScrapingResult,
): Promise<ScrapingResult> {
  try {
    const filePath = path.join(RESULTS_DIR, `${result.id}.json`);
    await fs.writeJson(filePath, result, { spaces: 2 });
    return result;
  } catch (error) {
    console.error(`Error saving result ${result.id} to file:`, error);
    throw error;
  }
}

/**
 * Load a scraping result from a JSON file
 * @param id The ID of the result to load
 * @returns The loaded result or null if not found
 */
export async function loadResultFromFile(
  id: string,
): Promise<ScrapingResult | null> {
  try {
    const filePath = path.join(RESULTS_DIR, `${id}.json`);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  } catch (error) {
    console.error(`Error loading result ${id} from file:`, error);
    return null;
  }
}

/**
 * Load all scraping results from JSON files
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Array of results
 */
export async function loadAllResultsFromFiles(
  limit?: number,
  offset = 0,
): Promise<ScrapingResult[]> {
  try {
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
 * Delete a scraping result JSON file
 * @param id The ID of the result to delete
 * @returns True if deleted successfully, false otherwise
 */
export async function deleteResultFile(id: string): Promise<boolean> {
  try {
    const filePath = path.join(RESULTS_DIR, `${id}.json`);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting result ${id} file:`, error);
    return false;
  }
}

// Initialize file storage when this module is imported
initializeFileStorage().catch(console.error);
