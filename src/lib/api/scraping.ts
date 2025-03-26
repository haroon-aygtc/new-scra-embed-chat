/**
 * Scraping API service
 * Handles all HTTP requests related to web scraping functionality
 */

import { ScrapingConfig } from "@/types/scraping";

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
        errorData.message || "Failed to perform scraping operation",
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
 */
export async function getScrapingResults() {
  try {
    const response = await fetch(`${API_BASE_URL}/scraping/results`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to retrieve scraping results",
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
        errorData.message || "Failed to retrieve scraping result",
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
        errorData.message || "Failed to save scraping configuration",
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
 */
export async function loadScrapingConfigurations() {
  try {
    const response = await fetch(`${API_BASE_URL}/scraping/configurations`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to load scraping configurations",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Load configurations API error:", error);
    throw error;
  }
}
