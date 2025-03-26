import { NextRequest, NextResponse } from "next/server";
import { ScrapingConfig } from "@/types/scraping";
import { generateUniqueId } from "@/lib/utils/ids";

// In-memory storage for configurations (in a real app, this would be a database)
let configurations: ScrapingConfig[] = [];

/**
 * API route handler for retrieving scraping configurations
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Validate parameters
    const validLimit = isNaN(limit) || limit <= 0 ? 10 : Math.min(limit, 100);
    const validOffset = isNaN(offset) || offset < 0 ? 0 : offset;

    // Return paginated results
    const paginatedConfigs = configurations.slice(
      validOffset,
      validOffset + validLimit,
    );

    // Return the configurations with proper caching headers
    return NextResponse.json(paginatedConfigs, {
      headers: {
        "Cache-Control": "public, max-age=10, stale-while-revalidate=30",
      },
    });
  } catch (error: any) {
    console.error("Get configurations API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to retrieve configurations",
        configurations: [],
      },
      { status: 500 },
    );
  }
}

/**
 * API route handler for saving a scraping configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const config: ScrapingConfig = await request.json();

    // Validate the configuration
    if (!config.url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Add metadata
    const now = new Date().toISOString();
    const configId = config.id || generateUniqueId();

    const updatedConfig: ScrapingConfig = {
      ...config,
      id: configId,
      createdAt: config.createdAt || now,
      updatedAt: now,
    };

    // Check if configuration already exists
    const existingIndex = configurations.findIndex((c) => c.id === configId);

    if (existingIndex >= 0) {
      // Update existing configuration
      configurations[existingIndex] = updatedConfig;
    } else {
      // Add new configuration
      configurations = [updatedConfig, ...configurations];
    }

    // Return the saved configuration
    return NextResponse.json(updatedConfig);
  } catch (error: any) {
    console.error("Save configuration API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save configuration" },
      { status: 500 },
    );
  }
}
