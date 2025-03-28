/**
 * Storage module for scraping configurations and results
 * This module handles the storage and retrieval of scraping configurations and results
 * using both MySQL database and JSON file storage for persistence
 */

import {
  ScrapingConfig,
  ScrapingResult,
  ExportOptions,
} from "@/types/scraping";
import { generateUniqueId } from "@/lib/utils/ids";
import {
  executeQuery,
  isDatabaseAvailable,
  testDatabaseConnection,
} from "@/lib/db/mysql";
import {
  saveConfigToFile,
  loadConfigFromFile,
  loadAllConfigsFromFiles,
  deleteConfigFile,
  saveResultToFile,
  loadResultFromFile,
  loadAllResultsFromFiles,
  deleteResultFile,
} from "@/lib/db/fileStorage";

/**
 * Generate a unique ID for database records
 * @returns A unique ID string
 */
function generateId(): string {
  return generateUniqueId();
}

/**
 * Save a scraping result to both MySQL and JSON file storage
 * @param result The scraping result to save
 * @returns The saved scraping result with an ID
 */
export async function saveScrapingResult(
  result: ScrapingResult,
): Promise<ScrapingResult> {
  try {
    console.log(
      `Storage: saveScrapingResult called for result with configId=${result.configId}`,
    );

    // Validate input
    if (!result) {
      const error = new Error(
        "Invalid scraping result: result object is null or undefined",
      );
      console.error("Storage: saveScrapingResult validation error:", error);
      throw error;
    }

    if (!result.configId) {
      const error = new Error("Invalid scraping result: configId is required");
      console.error("Storage: saveScrapingResult validation error:", error);
      throw error;
    }

    if (!result.url) {
      const error = new Error("Invalid scraping result: url is required");
      console.error("Storage: saveScrapingResult validation error:", error);
      throw error;
    }

    // Ensure the result has an ID
    if (!result.id) {
      result.id = generateId();
      console.log(`Storage: Generated new ID ${result.id} for scraping result`);
    }

    // Ensure timestamps are set
    if (!result.createdAt) {
      result.createdAt = new Date().toISOString();
    }
    result.updatedAt = new Date().toISOString();
    console.log(
      `Storage: Timestamps set for result ${result.id}, updatedAt=${result.updatedAt}`,
    );

    let savedToDb = false;

    // Save to MySQL database
    try {
      // Check if database is available before attempting to save
      if (!isDatabaseAvailable()) {
        console.log(
          `Storage: Database not available, skipping database save and using file storage only`,
        );
        throw new Error("Database not available");
      }

      console.log(
        `Storage: Checking if result ${result.id} already exists in database`,
      );
      // Check if result already exists
      const existingResult = await executeQuery(
        "SELECT id FROM scraping_results WHERE id = ?",
        [result.id],
      );

      // Prepare data for database
      const categoriesJson = JSON.stringify(result.categories || {});
      const rawJson = JSON.stringify(result.raw || {});
      const metadataJson = JSON.stringify(result.metadata || {});

      if (Array.isArray(existingResult) && existingResult.length > 0) {
        console.log(
          `Storage: Updating existing result ${result.id} in database`,
        );
        // Update existing result
        await executeQuery(
          `UPDATE scraping_results 
           SET configId = ?, url = ?, timestamp = ?, status = ?, 
               categories = ?, raw = ?, metadata = ?, updatedAt = ? 
           WHERE id = ?`,
          [
            result.configId,
            result.url,
            result.timestamp,
            result.status,
            categoriesJson,
            rawJson,
            metadataJson,
            result.updatedAt,
            result.id,
          ],
        );
        console.log(
          `Storage: Successfully updated result ${result.id} in database`,
        );
      } else {
        console.log(`Storage: Inserting new result ${result.id} into database`);
        // Insert new result
        await executeQuery(
          `INSERT INTO scraping_results 
           (id, configId, url, timestamp, status, categories, raw, metadata, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            result.id,
            result.configId,
            result.url,
            result.timestamp,
            result.status,
            categoriesJson,
            rawJson,
            metadataJson,
            result.createdAt,
            result.updatedAt,
          ],
        );
        console.log(
          `Storage: Successfully inserted result ${result.id} into database`,
        );
      }
      savedToDb = true;
    } catch (dbError) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";
      const errorStack = dbError instanceof Error ? dbError.stack : "";

      console.error("Storage: MySQL error saving scraping result:", {
        resultId: result.id,
        message: errorMessage,
        stack: errorStack,
        error: dbError,
      });
      // Continue to file storage even if database fails
    }

    // Save to JSON file
    try {
      console.log(`Storage: Saving result ${result.id} to file storage`);
      await saveResultToFile(result);
      console.log(
        `Storage: Successfully saved result ${result.id} to file storage`,
      );
    } catch (fileError) {
      const errorMessage =
        fileError instanceof Error
          ? fileError.message
          : "Unknown file storage error";
      const errorStack = fileError instanceof Error ? fileError.stack : "";

      console.error("Storage: File storage error saving scraping result:", {
        resultId: result.id,
        message: errorMessage,
        stack: errorStack,
        error: fileError,
      });

      // If we couldn't save to file but saved to DB, we're still ok
      if (savedToDb) {
        console.log(
          `Storage: Result ${result.id} saved to database but not to file storage`,
        );
        return result;
      }

      // If we couldn't save to either storage, throw an error
      const error = new Error(
        `Failed to save result ${result.id} to any storage medium: ${errorMessage}`,
      );
      console.error("Storage: Critical error saving result:", error);
      throw error;
    }

    console.log(
      `Storage: Successfully saved result ${result.id} to both database and file storage`,
    );
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Storage: Error saving scraping result:", {
      resultId: result?.id,
      configId: result?.configId,
      message: errorMessage,
      stack: errorStack,
      error,
    });
    throw error;
  }
}

/**
 * Get all scraping results from storage
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Array of scraping results
 */
export async function getScrapingResults(
  limit?: number,
  offset?: number,
): Promise<ScrapingResult[]> {
  try {
    console.log(
      `Storage: getScrapingResults called with limit=${limit}, offset=${offset}`,
    );

    // Validate input parameters
    if (limit !== undefined && (isNaN(limit) || limit < 0)) {
      const error = new Error(
        `Invalid limit parameter: ${limit}. Must be a positive number.`,
      );
      console.error("Storage: getScrapingResults validation error:", error);
      throw error;
    }

    if (offset !== undefined && (isNaN(offset) || offset < 0)) {
      const error = new Error(
        `Invalid offset parameter: ${offset}. Must be a positive number.`,
      );
      console.error("Storage: getScrapingResults validation error:", error);
      throw error;
    }

    const results: ScrapingResult[] = [];
    const offsetValue = offset || 0;

    // Try to get results from MySQL database
    try {
      // Check if database is available before attempting query
      if (!isDatabaseAvailable()) {
        console.log(
          `Storage: Database not available, skipping database query and using file storage directly`,
        );
        throw new Error("Database not available");
      }

      console.log(
        `Storage: Attempting to fetch results from database with limit=${limit}, offset=${offsetValue}`,
      );
      const query = limit
        ? `SELECT * FROM scraping_results ORDER BY timestamp DESC LIMIT ? OFFSET ?`
        : `SELECT * FROM scraping_results ORDER BY timestamp DESC`;

      const params = limit ? [limit, offsetValue] : [];
      const dbResults = await executeQuery(query, params);

      if (Array.isArray(dbResults) && dbResults.length > 0) {
        console.log(
          `Storage: Retrieved ${dbResults.length} results from database`,
        );
        // Parse JSON fields and add to results
        for (const row of dbResults) {
          try {
            const categories = JSON.parse(row.categories || "{}");
            const raw = JSON.parse(row.raw || "{}");
            const metadata = JSON.parse(row.metadata || "{}");

            results.push({
              id: row.id,
              configId: row.configId,
              url: row.url,
              timestamp:
                row.timestamp?.toISOString() || new Date().toISOString(),
              status: row.status,
              categories,
              raw,
              metadata,
              createdAt:
                row.createdAt?.toISOString() || new Date().toISOString(),
              updatedAt:
                row.updatedAt?.toISOString() || new Date().toISOString(),
            });
          } catch (parseError) {
            console.error(
              `Storage: Error parsing JSON fields for result ${row.id}:`,
              parseError,
            );
            // Skip this row and continue with others
          }
        }
        console.log(
          `Storage: Successfully processed ${results.length} results from database`,
        );
        return results;
      } else {
        console.log(
          `Storage: No results found in database, falling back to file storage`,
        );
      }
    } catch (dbError) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";
      const errorStack = dbError instanceof Error ? dbError.stack : "";

      console.error("Storage: MySQL error getting scraping results:", {
        message: errorMessage,
        stack: errorStack,
        error: dbError,
      });
      console.log(
        `Storage: Database query failed, falling back to file storage`,
      );
      // Fall back to file storage if database fails
    }

    // If no results from database or database failed, try file storage
    console.log(
      `Storage: Attempting to fetch results from file storage with limit=${limit}, offset=${offsetValue}`,
    );
    const fileResults = await loadAllResultsFromFiles(limit, offsetValue);
    console.log(
      `Storage: Retrieved ${fileResults.length} results from file storage`,
    );
    return fileResults;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Storage: Error getting scraping results:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });
    throw error;
  }
}

/**
 * Get a scraping result by ID
 * @param id The ID of the scraping result to get
 * @returns The scraping result or null if not found
 */
export async function getScrapingResultById(
  id: string,
): Promise<ScrapingResult | null> {
  try {
    console.log(`Storage: getScrapingResultById called for ID=${id}`);

    // Validate input
    if (!id) {
      const error = new Error("Invalid parameter: id is required");
      console.error("Storage: getScrapingResultById validation error:", error);
      throw error;
    }

    // Try to get result from MySQL database
    try {
      // Check if database is available before attempting query
      if (!isDatabaseAvailable()) {
        console.log(
          `Storage: Database not available, skipping database query and using file storage directly for ID=${id}`,
        );
        throw new Error("Database not available");
      }

      console.log(
        `Storage: Attempting to fetch result with ID=${id} from database`,
      );
      const dbResults = await executeQuery(
        "SELECT * FROM scraping_results WHERE id = ?",
        [id],
      );

      if (Array.isArray(dbResults) && dbResults.length > 0) {
        console.log(`Storage: Found result with ID=${id} in database`);
        const row = dbResults[0];
        try {
          const categories = JSON.parse(row.categories || "{}");
          const raw = JSON.parse(row.raw || "{}");
          const metadata = JSON.parse(row.metadata || "{}");

          const result = {
            id: row.id,
            configId: row.configId,
            url: row.url,
            timestamp: row.timestamp?.toISOString() || new Date().toISOString(),
            status: row.status,
            categories,
            raw,
            metadata,
            createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
          };

          console.log(
            `Storage: Successfully processed result with ID=${id} from database`,
          );
          return result;
        } catch (parseError) {
          console.error(
            `Storage: Error parsing JSON fields for result ${id}:`,
            parseError,
          );
          // Fall back to file storage if JSON parsing fails
        }
      } else {
        console.log(
          `Storage: Result with ID=${id} not found in database, checking file storage`,
        );
      }
    } catch (dbError) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";
      const errorStack = dbError instanceof Error ? dbError.stack : "";

      console.error(
        `Storage: MySQL error getting scraping result with ID ${id}:`,
        {
          message: errorMessage,
          stack: errorStack,
          error: dbError,
        },
      );
      console.log(
        `Storage: Database query failed, falling back to file storage for ID=${id}`,
      );
      // Fall back to file storage if database fails
    }

    // If not found in database or database failed, try file storage
    console.log(
      `Storage: Attempting to fetch result with ID=${id} from file storage`,
    );
    const fileResult = await loadResultFromFile(id);
    if (fileResult) {
      console.log(`Storage: Found result with ID=${id} in file storage`);
    } else {
      console.log(`Storage: Result with ID=${id} not found in file storage`);
    }
    return fileResult;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error(`Storage: Error getting scraping result with ID ${id}:`, {
      message: errorMessage,
      stack: errorStack,
      error,
    });
    return null;
  }
}

/**
 * Delete a scraping result by ID
 * @param id The ID of the scraping result to delete
 * @returns True if the result was deleted, false otherwise
 */
export async function deleteScrapingResult(id: string): Promise<boolean> {
  try {
    console.log(`Storage: deleteScrapingResult called for ID=${id}`);

    // Validate input
    if (!id) {
      const error = new Error("Invalid parameter: id is required");
      console.error("Storage: deleteScrapingResult validation error:", error);
      throw error;
    }

    let deletedFromDb = false;
    let deletedFromFile = false;
    let errors: string[] = [];

    // Try to delete from MySQL database
    try {
      // Check if database is available before attempting delete
      if (!isDatabaseAvailable()) {
        console.log(
          `Storage: Database not available, skipping database delete and using file storage only for ID=${id}`,
        );
        throw new Error("Database not available");
      }

      console.log(
        `Storage: Attempting to delete result with ID=${id} from database`,
      );
      const result = await executeQuery(
        "DELETE FROM scraping_results WHERE id = ?",
        [id],
      );

      // Check if any rows were affected
      deletedFromDb = result && (result as any).affectedRows > 0;
      if (deletedFromDb) {
        console.log(
          `Storage: Successfully deleted result with ID=${id} from database`,
        );
      } else {
        console.log(
          `Storage: No rows affected when deleting result with ID=${id} from database`,
        );
      }
    } catch (dbError) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";
      const errorStack = dbError instanceof Error ? dbError.stack : "";

      console.error(
        `Storage: MySQL error deleting scraping result with ID ${id}:`,
        {
          message: errorMessage,
          stack: errorStack,
          error: dbError,
        },
      );
      errors.push(`Database error: ${errorMessage}`);
      // Continue to file storage even if database fails
    }

    // Delete from JSON file storage
    try {
      console.log(
        `Storage: Attempting to delete result with ID=${id} from file storage`,
      );
      deletedFromFile = await deleteResultFile(id);
      if (deletedFromFile) {
        console.log(
          `Storage: Successfully deleted result with ID=${id} from file storage`,
        );
      } else {
        console.log(
          `Storage: Result with ID=${id} not found in file storage or could not be deleted`,
        );
      }
    } catch (fileError) {
      const errorMessage =
        fileError instanceof Error
          ? fileError.message
          : "Unknown file storage error";
      const errorStack = fileError instanceof Error ? fileError.stack : "";

      console.error(
        `Storage: File storage error deleting scraping result with ID ${id}:`,
        {
          message: errorMessage,
          stack: errorStack,
          error: fileError,
        },
      );
      errors.push(`File storage error: ${errorMessage}`);
    }

    // If deleted from either storage, return true
    if (deletedFromDb || deletedFromFile) {
      console.log(
        `Storage: Result with ID=${id} was successfully deleted from at least one storage medium`,
      );
      return true;
    }

    // If not deleted from either storage and we have errors, log them
    if (errors.length > 0) {
      console.error(
        `Storage: Failed to delete result ${id} from any storage medium:`,
        errors,
      );
    } else {
      console.warn(
        `Storage: Result with ID=${id} was not found in any storage medium`,
      );
    }

    // Return false if not deleted from either storage
    return false;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error(`Storage: Error deleting scraping result with ID ${id}:`, {
      message: errorMessage,
      stack: errorStack,
      error,
    });
    return false;
  }
}

/**
 * Save a scraping configuration to both MySQL and JSON file storage
 * @param config The scraping configuration to save
 * @returns The saved scraping configuration with an ID
 */
export async function saveScrapingConfig(
  config: ScrapingConfig,
): Promise<ScrapingConfig> {
  try {
    console.log(
      `Storage: saveScrapingConfig called for config with name=${config.name}`,
    );

    // Validate input
    if (!config) {
      const error = new Error(
        "Invalid scraping configuration: config object is null or undefined",
      );
      console.error("Storage: saveScrapingConfig validation error:", error);
      throw error;
    }

    if (!config.url) {
      const error = new Error(
        "Invalid scraping configuration: url is required",
      );
      console.error("Storage: saveScrapingConfig validation error:", error);
      throw error;
    }

    // Ensure the config has an ID
    if (!config.id) {
      config.id = generateId();
      console.log(
        `Storage: Generated new ID ${config.id} for scraping configuration`,
      );
    }

    // Ensure timestamps are set
    if (!config.createdAt) {
      config.createdAt = new Date().toISOString();
    }
    config.updatedAt = new Date().toISOString();
    console.log(
      `Storage: Timestamps set for config ${config.id}, updatedAt=${config.updatedAt}`,
    );

    let savedToDb = false;

    // Save to MySQL database
    try {
      // Check if database is available before attempting to save
      if (!isDatabaseAvailable()) {
        console.log(
          `Storage: Database not available, skipping database save and using file storage only`,
        );
        throw new Error("Database not available");
      }

      console.log(
        `Storage: Checking if config ${config.id} already exists in database`,
      );
      // Check if config already exists
      const existingConfig = await executeQuery(
        "SELECT id FROM scraping_configurations WHERE id = ?",
        [config.id],
      );

      // Prepare data for database
      const categoriesJson = JSON.stringify(config.categories || []);
      const optionsJson = JSON.stringify(config.options || {});
      const scheduleJson = JSON.stringify(config.schedule || {});
      const urlsJson = JSON.stringify(config.urls || []);
      const configDataJson = JSON.stringify(config);

      if (Array.isArray(existingConfig) && existingConfig.length > 0) {
        console.log(
          `Storage: Updating existing config ${config.id} in database`,
        );
        // Update existing config
        await executeQuery(
          `UPDATE scraping_configurations 
           SET name = ?, url = ?, mode = ?, scrapingMode = ?, 
               selector = ?, selectorType = ?, categories = ?, 
               options = ?, schedule = ?, outputFormat = ?, 
               urls = ?, updatedAt = ?, config_data = ? 
           WHERE id = ?`,
          [
            config.name || "",
            config.url,
            config.mode,
            config.scrapingMode,
            config.selector || "",
            config.selectorType || "",
            categoriesJson,
            optionsJson,
            scheduleJson,
            config.outputFormat || "json",
            urlsJson,
            config.updatedAt,
            configDataJson,
            config.id,
          ],
        );
        console.log(
          `Storage: Successfully updated config ${config.id} in database`,
        );
      } else {
        console.log(`Storage: Inserting new config ${config.id} into database`);
        // Insert new config
        await executeQuery(
          `INSERT INTO scraping_configurations 
           (id, name, url, mode, scrapingMode, selector, selectorType, 
            categories, options, schedule, outputFormat, urls, 
            createdAt, updatedAt, config_data) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            config.id,
            config.name || "",
            config.url,
            config.mode,
            config.scrapingMode,
            config.selector || "",
            config.selectorType || "",
            categoriesJson,
            optionsJson,
            scheduleJson,
            config.outputFormat || "json",
            urlsJson,
            config.createdAt,
            config.updatedAt,
            configDataJson,
          ],
        );
        console.log(
          `Storage: Successfully inserted config ${config.id} into database`,
        );
      }
      savedToDb = true;
    } catch (dbError) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";
      const errorStack = dbError instanceof Error ? dbError.stack : "";

      console.error("Storage: MySQL error saving scraping configuration:", {
        configId: config.id,
        message: errorMessage,
        stack: errorStack,
        error: dbError,
      });
      // Continue to file storage even if database fails
    }

    // Save to JSON file
    try {
      console.log(`Storage: Saving config ${config.id} to file storage`);
      await saveConfigToFile(config);
      console.log(
        `Storage: Successfully saved config ${config.id} to file storage`,
      );
    } catch (fileError) {
      const errorMessage =
        fileError instanceof Error
          ? fileError.message
          : "Unknown file storage error";
      const errorStack = fileError instanceof Error ? fileError.stack : "";

      console.error(
        "Storage: File storage error saving scraping configuration:",
        {
          configId: config.id,
          message: errorMessage,
          stack: errorStack,
          error: fileError,
        },
      );

      // If we couldn't save to file but saved to DB, we're still ok
      if (savedToDb) {
        console.log(
          `Storage: Configuration ${config.id} saved to database but not to file storage`,
        );
        return config;
      }

      // If we couldn't save to either storage, throw an error
      const error = new Error(
        `Failed to save configuration ${config.id} to any storage medium: ${errorMessage}`,
      );
      console.error("Storage: Critical error saving configuration:", error);
      throw error;
    }

    console.log(
      `Storage: Successfully saved config ${config.id} to both database and file storage`,
    );
    return config;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Storage: Error saving scraping configuration:", {
      configId: config?.id,
      name: config?.name,
      message: errorMessage,
      stack: errorStack,
      error,
    });
    throw error;
  }
}

/**
 * Get all scraping configurations from storage
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Array of scraping configurations
 */
export async function getScrapingConfigs(
  limit?: number,
  offset?: number,
): Promise<ScrapingConfig[]> {
  try {
    console.log(
      `Storage: getScrapingConfigs called with limit=${limit}, offset=${offset}`,
    );

    // Validate input parameters
    if (limit !== undefined && (isNaN(limit) || limit < 0)) {
      const error = new Error(
        `Invalid limit parameter: ${limit}. Must be a positive number.`,
      );
      console.error("Storage: getScrapingConfigs validation error:", error);
      throw error;
    }

    if (offset !== undefined && (isNaN(offset) || offset < 0)) {
      const error = new Error(
        `Invalid offset parameter: ${offset}. Must be a positive number.`,
      );
      console.error("Storage: getScrapingConfigs validation error:", error);
      throw error;
    }

    const configs: ScrapingConfig[] = [];
    const offsetValue = offset || 0;

    // Try to get configs from MySQL database
    try {
      // Check if database is available before attempting query
      if (!isDatabaseAvailable()) {
        console.log(
          `Storage: Database not available, skipping database query and using file storage directly`,
        );
        throw new Error("Database not available");
      }

      console.log(
        `Storage: Attempting to fetch configurations from database with limit=${limit}, offset=${offsetValue}`,
      );
      const query = limit
        ? `SELECT * FROM scraping_configurations ORDER BY updatedAt DESC LIMIT ? OFFSET ?`
        : `SELECT * FROM scraping_configurations ORDER BY updatedAt DESC`;

      const params = limit ? [limit, offsetValue] : [];
      const dbConfigs = await executeQuery(query, params);

      if (Array.isArray(dbConfigs) && dbConfigs.length > 0) {
        console.log(
          `Storage: Retrieved ${dbConfigs.length} configurations from database`,
        );
        // Parse JSON fields and add to configs
        for (const row of dbConfigs) {
          // If we have the full config in config_data, use it
          if (row.config_data) {
            try {
              const fullConfig = JSON.parse(row.config_data);
              configs.push(fullConfig);
              continue;
            } catch (parseError) {
              console.error(
                `Storage: Error parsing config_data for ${row.id}:`,
                parseError,
              );
              // Fall back to reconstructing from individual fields
            }
          }

          try {
            // Reconstruct config from individual fields
            const categories = JSON.parse(row.categories || "[]");
            const options = JSON.parse(row.options || "{}");
            const schedule = JSON.parse(row.schedule || "{}");
            const urls = JSON.parse(row.urls || "[]");

            configs.push({
              id: row.id,
              name: row.name,
              url: row.url,
              mode: row.mode,
              scrapingMode: row.scrapingMode,
              selector: row.selector,
              selectorType: row.selectorType,
              categories,
              options,
              schedule,
              outputFormat: row.outputFormat,
              urls,
              createdAt:
                row.createdAt?.toISOString() || new Date().toISOString(),
              updatedAt:
                row.updatedAt?.toISOString() || new Date().toISOString(),
            });
          } catch (parseError) {
            console.error(
              `Storage: Error parsing JSON fields for config ${row.id}:`,
              parseError,
            );
            // Skip this row and continue with others
          }
        }
        console.log(
          `Storage: Successfully processed ${configs.length} configurations from database`,
        );
        return configs;
      } else {
        console.log(
          `Storage: No configurations found in database, falling back to file storage`,
        );
      }
    } catch (dbError) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";
      const errorStack = dbError instanceof Error ? dbError.stack : "";

      console.error("Storage: MySQL error getting scraping configurations:", {
        message: errorMessage,
        stack: errorStack,
        error: dbError,
      });
      console.log(
        `Storage: Database query failed, falling back to file storage`,
      );
      // Fall back to file storage if database fails
    }

    // If no configs from database or database failed, try file storage
    console.log(
      `Storage: Attempting to fetch configurations from file storage with limit=${limit}, offset=${offsetValue}`,
    );
    const fileConfigs = await loadAllConfigsFromFiles(limit, offsetValue);
    console.log(
      `Storage: Retrieved ${fileConfigs.length} configurations from file storage`,
    );
    return fileConfigs;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Storage: Error getting scraping configurations:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });
    throw error;
  }
}

/**
 * Get a scraping configuration by ID
 * @param id The ID of the scraping configuration to get
 * @returns The scraping configuration or null if not found
 */
export async function getScrapingConfigById(
  id: string,
): Promise<ScrapingConfig | null> {
  try {
    console.log(`Storage: getScrapingConfigById called for ID=${id}`);

    // Validate input
    if (!id) {
      const error = new Error("Invalid parameter: id is required");
      console.error("Storage: getScrapingConfigById validation error:", error);
      throw error;
    }

    // Try to get config from MySQL database
    try {
      // Check if database is available before attempting query
      if (!isDatabaseAvailable()) {
        console.log(
          `Storage: Database not available, skipping database query and using file storage directly for ID=${id}`,
        );
        throw new Error("Database not available");
      }

      console.log(
        `Storage: Attempting to fetch configuration with ID=${id} from database`,
      );
      const dbConfigs = await executeQuery(
        "SELECT * FROM scraping_configurations WHERE id = ?",
        [id],
      );

      if (Array.isArray(dbConfigs) && dbConfigs.length > 0) {
        console.log(`Storage: Found configuration with ID=${id} in database`);
        const row = dbConfigs[0];

        // If we have the full config in config_data, use it
        if (row.config_data) {
          try {
            const fullConfig = JSON.parse(row.config_data);
            console.log(
              `Storage: Successfully parsed full config_data for ID=${id}`,
            );
            return fullConfig;
          } catch (parseError) {
            console.error(
              `Storage: Error parsing config_data for ${id}:`,
              parseError,
            );
            console.log(
              `Storage: Falling back to reconstructing from individual fields for ID=${id}`,
            );
            // Fall back to reconstructing from individual fields
          }
        }

        try {
          // Reconstruct config from individual fields
          const categories = JSON.parse(row.categories || "[]");
          const options = JSON.parse(row.options || "{}");
          const schedule = JSON.parse(row.schedule || "{}");
          const urls = JSON.parse(row.urls || "[]");

          const config = {
            id: row.id,
            name: row.name,
            url: row.url,
            mode: row.mode,
            scrapingMode: row.scrapingMode,
            selector: row.selector,
            selectorType: row.selectorType,
            categories,
            options,
            schedule,
            outputFormat: row.outputFormat,
            urls,
            createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
          };

          console.log(
            `Storage: Successfully reconstructed config with ID=${id} from individual fields`,
          );
          return config;
        } catch (parseError) {
          console.error(
            `Storage: Error parsing JSON fields for config ${id}:`,
            parseError,
          );
          console.log(
            `Storage: Falling back to file storage for ID=${id} due to JSON parsing error`,
          );
          // Fall back to file storage if JSON parsing fails
        }
      } else {
        console.log(
          `Storage: Configuration with ID=${id} not found in database, checking file storage`,
        );
      }
    } catch (dbError) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";
      const errorStack = dbError instanceof Error ? dbError.stack : "";

      console.error(
        `Storage: MySQL error getting scraping config with ID ${id}:`,
        {
          message: errorMessage,
          stack: errorStack,
          error: dbError,
        },
      );
      console.log(
        `Storage: Database query failed, falling back to file storage for ID=${id}`,
      );
      // Fall back to file storage if database fails
    }

    // If not found in database or database failed, try file storage
    console.log(
      `Storage: Attempting to fetch configuration with ID=${id} from file storage`,
    );
    const fileConfig = await loadConfigFromFile(id);
    if (fileConfig) {
      console.log(`Storage: Found configuration with ID=${id} in file storage`);
    } else {
      console.log(
        `Storage: Configuration with ID=${id} not found in file storage`,
      );
    }
    return fileConfig;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error(`Storage: Error getting scraping config with ID ${id}:`, {
      message: errorMessage,
      stack: errorStack,
      error,
    });
    return null;
  }
}

/**
 * Delete a scraping configuration by ID
 * @param id The ID of the scraping configuration to delete
 * @returns True if the configuration was deleted, false otherwise
 */
export async function deleteScrapingConfig(id: string): Promise<boolean> {
  try {
    console.log(`Storage: deleteScrapingConfig called for ID=${id}`);

    // Validate input
    if (!id) {
      const error = new Error("Invalid parameter: id is required");
      console.error("Storage: deleteScrapingConfig validation error:", error);
      throw error;
    }

    let deletedFromDb = false;
    let deletedFromFile = false;
    let errors: string[] = [];

    // Try to delete from MySQL database
    try {
      // Check if database is available before attempting delete
      if (!isDatabaseAvailable()) {
        console.log(
          `Storage: Database not available, skipping database delete and using file storage only for ID=${id}`,
        );
        throw new Error("Database not available");
      }

      console.log(
        `Storage: Attempting to delete configuration with ID=${id} from database`,
      );
      const result = await executeQuery(
        "DELETE FROM scraping_configurations WHERE id = ?",
        [id],
      );

      // Check if any rows were affected
      deletedFromDb = result && (result as any).affectedRows > 0;
      if (deletedFromDb) {
        console.log(
          `Storage: Successfully deleted configuration with ID=${id} from database`,
        );
      } else {
        console.log(
          `Storage: No rows affected when deleting configuration with ID=${id} from database`,
        );
      }
    } catch (dbError) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";
      const errorStack = dbError instanceof Error ? dbError.stack : "";

      console.error(
        `Storage: MySQL error deleting scraping config with ID ${id}:`,
        {
          message: errorMessage,
          stack: errorStack,
          error: dbError,
        },
      );
      errors.push(`Database error: ${errorMessage}`);
      // Continue to file storage even if database fails
    }

    // Delete from JSON file storage
    try {
      console.log(
        `Storage: Attempting to delete configuration with ID=${id} from file storage`,
      );
      deletedFromFile = await deleteConfigFile(id);
      if (deletedFromFile) {
        console.log(
          `Storage: Successfully deleted configuration with ID=${id} from file storage`,
        );
      } else {
        console.log(
          `Storage: Configuration with ID=${id} not found in file storage or could not be deleted`,
        );
      }
    } catch (fileError) {
      const errorMessage =
        fileError instanceof Error
          ? fileError.message
          : "Unknown file storage error";
      const errorStack = fileError instanceof Error ? fileError.stack : "";

      console.error(
        `Storage: File storage error deleting scraping config with ID ${id}:`,
        {
          message: errorMessage,
          stack: errorStack,
          error: fileError,
        },
      );
      errors.push(`File storage error: ${errorMessage}`);
    }

    // If deleted from either storage, return true
    if (deletedFromDb || deletedFromFile) {
      console.log(
        `Storage: Configuration with ID=${id} was successfully deleted from at least one storage medium`,
      );
      return true;
    }

    // If not deleted from either storage and we have errors, log them
    if (errors.length > 0) {
      console.error(
        `Storage: Failed to delete configuration ${id} from any storage medium:`,
        errors,
      );
    } else {
      console.warn(
        `Storage: Configuration with ID=${id} was not found in any storage medium`,
      );
    }

    // Return false if not deleted from either storage
    return false;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error(`Storage: Error deleting scraping config with ID ${id}:`, {
      message: errorMessage,
      stack: errorStack,
      error,
    });
    return false;
  }
}

/**
 * Export scraping results in various formats
 * @param options Export options
 * @returns The exported data
 */
export async function exportScrapingResults(
  options: ExportOptions,
): Promise<any> {
  try {
    console.log(
      `Storage: exportScrapingResults called with format=${options.format}`,
    );

    // Validate input
    if (!options) {
      const error = new Error("Invalid parameter: options object is required");
      console.error("Storage: exportScrapingResults validation error:", error);
      throw error;
    }

    if (!options.format) {
      console.warn(
        'Storage: No format specified in export options, defaulting to "json"',
      );
      options.format = "json";
    }

    // Get the results to export
    let results: ScrapingResult[] = [];

    if (options.resultId) {
      console.log(
        `Storage: Exporting single result with ID=${options.resultId}`,
      );
      // Export a single result
      const result = await getScrapingResultById(options.resultId);
      if (result) {
        results = [result];
        console.log(
          `Storage: Found result with ID=${options.resultId} for export`,
        );
      } else {
        console.warn(
          `Storage: Result with ID=${options.resultId} not found for export`,
        );
      }
    } else if (options.configId) {
      console.log(
        `Storage: Exporting results for configuration with ID=${options.configId}`,
      );
      // Export results for a specific configuration
      const allResults = await getScrapingResults();
      results = allResults.filter((r) => r.configId === options.configId);
      console.log(
        `Storage: Found ${results.length} results for configuration ID=${options.configId}`,
      );
    } else {
      console.log(
        `Storage: Exporting all results with limit=${options.limit}, offset=${options.offset}`,
      );
      // Export all results
      results = await getScrapingResults(options.limit, options.offset);
      console.log(`Storage: Retrieved ${results.length} results for export`);
    }

    // Format the results according to the export format
    console.log(
      `Storage: Converting ${results.length} results to ${options.format} format`,
    );
    let exportData;

    try {
      switch (options.format) {
        case "json":
          exportData = { data: results, format: "json" };
          break;
        case "csv":
          exportData = { data: convertResultsToCsv(results), format: "csv" };
          break;
        case "excel":
          exportData = { data: convertResultsToCsv(results), format: "excel" };
          break;
        case "pdf":
          exportData = { data: results, format: "pdf" };
          break;
        case "markdown":
          exportData = {
            data: convertResultsToMarkdown(results),
            format: "markdown",
          };
          break;
        case "html":
          exportData = { data: convertResultsToHtml(results), format: "html" };
          break;
        case "text":
          exportData = { data: convertResultsToText(results), format: "text" };
          break;
        default:
          console.warn(
            `Storage: Unsupported format "${options.format}", defaulting to json`,
          );
          exportData = { data: results, format: "json" };
      }

      console.log(
        `Storage: Successfully exported ${results.length} results to ${options.format} format`,
      );
      return exportData;
    } catch (formatError) {
      const errorMessage =
        formatError instanceof Error
          ? formatError.message
          : "Unknown format error";
      console.error(
        `Storage: Error converting results to ${options.format} format:`,
        formatError,
      );
      throw new Error(
        `Failed to convert results to ${options.format} format: ${errorMessage}`,
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Storage: Error exporting scraping results:", {
      format: options?.format,
      resultId: options?.resultId,
      configId: options?.configId,
      message: errorMessage,
      stack: errorStack,
      error,
    });
    throw error;
  }
}

/**
 * Convert scraping results to Markdown format
 * @param results Array of scraping results
 * @returns Markdown string
 */
function convertResultsToMarkdown(results: ScrapingResult[]): string {
  if (results.length === 0) return "No results found.";

  let markdown = "# Scraping Results\n\n";

  for (const result of results) {
    markdown += `## Result: ${result.id}\n\n`;
    markdown += `- **URL:** ${result.url}\n`;
    markdown += `- **Status:** ${result.status}\n`;
    markdown += `- **Timestamp:** ${result.timestamp}\n\n`;

    if (Object.keys(result.categories).length > 0) {
      markdown += "### Categories\n\n";

      for (const [category, data] of Object.entries(result.categories)) {
        markdown += `#### ${category}\n\n`;
        markdown += `${data.description}\n\n`;

        if (data.items && data.items.length > 0) {
          for (const item of data.items) {
            markdown += `- **${item.title}**\n`;
            markdown += `  ${item.content}\n\n`;
          }
        } else {
          markdown += "No items found.\n\n";
        }
      }
    }

    markdown += "---\n\n";
  }

  return markdown;
}

/**
 * Convert scraping results to HTML format
 * @param results Array of scraping results
 * @returns HTML string
 */
function convertResultsToHtml(results: ScrapingResult[]): string {
  if (results.length === 0) return "<p>No results found.</p>";

  let html = "<html><head><title>Scraping Results</title>";
  html +=
    "<style>body{font-family:Arial,sans-serif;line-height:1.6;margin:20px;} h1{color:#333;} h2{color:#444;margin-top:20px;} h3{color:#555;} h4{color:#666;} .item{margin-bottom:10px;border-left:3px solid #ddd;padding-left:10px;} .divider{border-top:1px solid #eee;margin:20px 0;}</style>";
  html += "</head><body>";
  html += "<h1>Scraping Results</h1>";

  for (const result of results) {
    html += `<h2>Result: ${result.id}</h2>`;
    html += `<p><strong>URL:</strong> ${result.url}</p>`;
    html += `<p><strong>Status:</strong> ${result.status}</p>`;
    html += `<p><strong>Timestamp:</strong> ${result.timestamp}</p>`;

    if (Object.keys(result.categories).length > 0) {
      html += "<h3>Categories</h3>";

      for (const [category, data] of Object.entries(result.categories)) {
        html += `<h4>${category}</h4>`;
        html += `<p>${data.description}</p>`;

        if (data.items && data.items.length > 0) {
          html += "<div>";
          for (const item of data.items) {
            html += `<div class="item"><strong>${item.title}</strong><p>${item.content}</p></div>`;
          }
          html += "</div>";
        } else {
          html += "<p>No items found.</p>";
        }
      }
    }

    html += "<div class='divider'></div>";
  }

  html += "</body></html>";
  return html;
}

/**
 * Convert scraping results to plain text format
 * @param results Array of scraping results
 * @returns Text string
 */
function convertResultsToText(results: ScrapingResult[]): string {
  if (results.length === 0) return "No results found.";

  let text = "SCRAPING RESULTS\n\n";

  for (const result of results) {
    text += `RESULT: ${result.id}\n`;
    text += `URL: ${result.url}\n`;
    text += `STATUS: ${result.status}\n`;
    text += `TIMESTAMP: ${result.timestamp}\n\n`;

    if (Object.keys(result.categories).length > 0) {
      text += "CATEGORIES:\n\n";

      for (const [category, data] of Object.entries(result.categories)) {
        text += `${category.toUpperCase()}\n`;
        text += `${data.description}\n\n`;

        if (data.items && data.items.length > 0) {
          for (const item of data.items) {
            text += `- ${item.title}\n`;
            text += `  ${item.content}\n\n`;
          }
        } else {
          text += "No items found.\n\n";
        }
      }
    }

    text += "----------------------------------------\n\n";
  }

  return text;
}

/**
 * Convert scraping results to CSV format
 * @param results Array of scraping results
 * @returns CSV string
 */
function convertResultsToCsv(results: ScrapingResult[]): string {
  if (results.length === 0) return "";

  // Define CSV headers
  const headers = [
    "id",
    "configId",
    "url",
    "timestamp",
    "status",
    "categories",
    "metadata",
  ];

  // Create CSV rows
  const rows = [
    headers.join(","),
    ...results.map((result) => {
      return [
        result.id,
        result.configId,
        `"${result.url.replace(/"/g, '""')}"`,
        result.timestamp,
        result.status,
        `"${JSON.stringify(result.categories).replace(/"/g, '""')}"`,
        `"${JSON.stringify(result.metadata).replace(/"/g, '""')}"`,
      ].join(",");
    }),
  ];

  return rows.join("\n");
}
