/**
 * Scraping API service
 * Handles all HTTP requests related to web scraping functionality
 */

import {
  ScrapingConfig,
  ScrapingResult,
  ExportOptions,
} from "@/types/scraping";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

/**
 * Performs a web scraping operation based on the provided configuration
 */
export async function performScraping(config: ScrapingConfig) {
  try {
    const response = await fetch(`${API_BASE_URL}/scraping`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          errorData.message ||
          "Failed to perform scraping operation",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Scraping API error:", error);
    throw error;
  }
}

/**
 * Retrieves the list of saved scraping results
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 */
export async function getScrapingResults(limit?: number, offset?: number) {
  try {
    let url = `${API_BASE_URL}/scraping/results`;
    const params = new URLSearchParams();

    if (limit !== undefined) params.append("limit", limit.toString());
    if (offset !== undefined) params.append("offset", offset.toString());

    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          errorData.message ||
          "Failed to retrieve scraping results",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Scraping results API error:", error);
    throw error;
  }
}

/**
 * Retrieves a specific scraping result by ID
 */
export async function getScrapingResultById(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/scraping/results/${id}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          errorData.message ||
          "Failed to retrieve scraping result",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Scraping result API error:", error);
    throw error;
  }
}

/**
 * Saves a scraping configuration
 */
export async function saveScrapingConfiguration(config: ScrapingConfig) {
  try {
    const response = await fetch(`${API_BASE_URL}/scraping/configurations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          errorData.message ||
          "Failed to save scraping configuration",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Save configuration API error:", error);
    throw error;
  }
}

/**
 * Loads saved scraping configurations
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 */
export async function loadScrapingConfigurations(
  limit?: number,
  offset?: number,
) {
  try {
    let url = `${API_BASE_URL}/scraping/configurations`;
    const params = new URLSearchParams();

    if (limit !== undefined) params.append("limit", limit.toString());
    if (offset !== undefined) params.append("offset", offset.toString());

    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          errorData.message ||
          "Failed to load scraping configurations",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Load configurations API error:", error);
    throw error;
  }
}

/**
 * Deletes a scraping configuration by ID
 */
export async function deleteScrapingConfiguration(id: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/scraping/configurations/${id}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          errorData.message ||
          "Failed to delete scraping configuration",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Delete configuration API error:", error);
    throw error;
  }
}

/**
 * Saves a scraping result
 */
export async function saveScrapingResult(result: ScrapingResult) {
  try {
    const response = await fetch(`${API_BASE_URL}/scraping/results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          errorData.message ||
          "Failed to save scraping result",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Save result API error:", error);
    throw error;
  }
}

/**
 * Deletes a scraping result by ID
 */
export async function deleteScrapingResult(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/scraping/results/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          errorData.message ||
          "Failed to delete scraping result",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Delete result API error:", error);
    throw error;
  }
}

/**
 * Exports scraping results in various formats
 */
export async function exportScrapingResults(options: ExportOptions) {
  try {
    const response = await fetch(`${API_BASE_URL}/scraping/results/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          errorData.message ||
          "Failed to export scraping results",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Export results API error:", error);
    throw error;
  }
}

/**
 * Adds a scraping job to the queue
 */
export async function queueScrapingJob(
  config: ScrapingConfig,
  priority?: "high" | "medium" | "low",
) {
  try {
    const response = await fetch(`${API_BASE_URL}/scraping/queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ config, priority }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || errorData.message || "Failed to queue scraping job",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Queue scraping job API error:", error);
    throw error;
  }
}
