/**
 * Data synchronization module
 * Handles synchronization between MySQL database and JSON files
 */

import { executeQuery } from "@/lib/db/mysql";
import {
  loadAllConfigsFromFiles,
  saveConfigToFile,
  loadAllResultsFromFiles,
  saveResultToFile,
} from "@/lib/db/fileStorage";
import { ScrapingConfig, ScrapingResult } from "@/types/scraping";

/**
 * Synchronize configurations between MySQL and JSON files
 * @returns Number of synchronized configurations
 */
export async function syncConfigurations(): Promise<number> {
  try {
    console.log("Starting configuration synchronization...");
    let syncCount = 0;

    // Get configurations from MySQL
    let dbConfigs: ScrapingConfig[] = [];
    try {
      const dbResults = await executeQuery(
        "SELECT * FROM scraping_configurations",
      );

      if (Array.isArray(dbResults) && dbResults.length > 0) {
        for (const row of dbResults) {
          // If we have the full config in config_data, use it
          if (row.config_data) {
            try {
              const fullConfig = JSON.parse(row.config_data);
              dbConfigs.push(fullConfig);
            } catch (parseError) {
              console.error(
                `Error parsing config_data for ${row.id}:`,
                parseError,
              );
              // Fall back to reconstructing from individual fields
              dbConfigs.push({
                id: row.id,
                name: row.name,
                url: row.url,
                mode: row.mode,
                scrapingMode: row.scrapingMode,
                selector: row.selector,
                selectorType: row.selectorType,
                categories: JSON.parse(row.categories || "[]"),
                options: JSON.parse(row.options || "{}"),
                schedule: JSON.parse(row.schedule || "{}"),
                outputFormat: row.outputFormat,
                urls: JSON.parse(row.urls || "[]"),
                createdAt:
                  row.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt:
                  row.updatedAt?.toISOString() || new Date().toISOString(),
              });
            }
          } else {
            // Reconstruct config from individual fields
            dbConfigs.push({
              id: row.id,
              name: row.name,
              url: row.url,
              mode: row.mode,
              scrapingMode: row.scrapingMode,
              selector: row.selector,
              selectorType: row.selectorType,
              categories: JSON.parse(row.categories || "[]"),
              options: JSON.parse(row.options || "{}"),
              schedule: JSON.parse(row.schedule || "{}"),
              outputFormat: row.outputFormat,
              urls: JSON.parse(row.urls || "[]"),
              createdAt:
                row.createdAt?.toISOString() || new Date().toISOString(),
              updatedAt:
                row.updatedAt?.toISOString() || new Date().toISOString(),
            });
          }
        }
      }
    } catch (dbError) {
      console.error("MySQL error getting configurations:", dbError);
      // Continue with file synchronization
    }

    // Get configurations from JSON files
    const fileConfigs = await loadAllConfigsFromFiles();

    // Create a map of configurations by ID
    const configMap = new Map<string, ScrapingConfig>();

    // Add database configurations to the map
    for (const config of dbConfigs) {
      if (config.id) {
        configMap.set(config.id, config);
      }
    }

    // Add file configurations to the map, overwriting database configurations if newer
    for (const config of fileConfigs) {
      if (config.id) {
        const existingConfig = configMap.get(config.id);

        if (
          !existingConfig ||
          new Date(config.updatedAt || 0) >
            new Date(existingConfig.updatedAt || 0)
        ) {
          configMap.set(config.id, config);
        }
      }
    }

    // Save all configurations to files
    for (const config of configMap.values()) {
      await saveConfigToFile(config);
      syncCount++;
    }

    console.log(`Synchronized ${syncCount} configurations`);
    return syncCount;
  } catch (error) {
    console.error("Error synchronizing configurations:", error);
    throw error;
  }
}

/**
 * Synchronize results between MySQL and JSON files
 * @returns Number of synchronized results
 */
export async function syncResults(): Promise<number> {
  try {
    console.log("Starting result synchronization...");
    let syncCount = 0;

    // Get results from MySQL
    let dbResults: ScrapingResult[] = [];
    try {
      const dbQueryResults = await executeQuery(
        "SELECT * FROM scraping_results",
      );

      if (Array.isArray(dbQueryResults) && dbQueryResults.length > 0) {
        for (const row of dbQueryResults) {
          try {
            dbResults.push({
              id: row.id,
              configId: row.configId,
              url: row.url,
              timestamp:
                row.timestamp?.toISOString() || new Date().toISOString(),
              status: row.status,
              categories: JSON.parse(row.categories || "{}"),
              raw: JSON.parse(row.raw || "{}"),
              metadata: JSON.parse(row.metadata || "{}"),
              createdAt:
                row.createdAt?.toISOString() || new Date().toISOString(),
              updatedAt:
                row.updatedAt?.toISOString() || new Date().toISOString(),
            });
          } catch (parseError) {
            console.error(
              `Error parsing result data for ${row.id}:`,
              parseError,
            );
            // Skip this result
          }
        }
      }
    } catch (dbError) {
      console.error("MySQL error getting results:", dbError);
      // Continue with file synchronization
    }

    // Get results from JSON files
    const fileResults = await loadAllResultsFromFiles();

    // Create a map of results by ID
    const resultMap = new Map<string, ScrapingResult>();

    // Add database results to the map
    for (const result of dbResults) {
      if (result.id) {
        resultMap.set(result.id, result);
      }
    }

    // Add file results to the map, overwriting database results if newer
    for (const result of fileResults) {
      if (result.id) {
        const existingResult = resultMap.get(result.id);

        if (
          !existingResult ||
          new Date(result.updatedAt || 0) >
            new Date(existingResult.updatedAt || 0)
        ) {
          resultMap.set(result.id, result);
        }
      }
    }

    // Save all results to files
    for (const result of resultMap.values()) {
      await saveResultToFile(result);
      syncCount++;
    }

    console.log(`Synchronized ${syncCount} results`);
    return syncCount;
  } catch (error) {
    console.error("Error synchronizing results:", error);
    throw error;
  }
}

/**
 * Synchronize all data between MySQL and JSON files
 * @returns Object with counts of synchronized items
 */
export async function syncAll(): Promise<{
  configurations: number;
  results: number;
}> {
  try {
    const configCount = await syncConfigurations();
    const resultCount = await syncResults();

    return {
      configurations: configCount,
      results: resultCount,
    };
  } catch (error) {
    console.error("Error synchronizing all data:", error);
    throw error;
  }
}
