/**
 * API route for scraping configurations
 * Handles GET and POST requests for scraping configurations
 */

import { NextRequest, NextResponse } from "next/server";
import { ScrapingConfig } from "@/types/scraping";
import {
  getScrapingConfigs,
  saveScrapingConfig,
  deleteScrapingConfig,
} from "@/lib/scraping/storage";
import { generateUniqueId } from "@/lib/utils/ids";

/**
 * GET handler for scraping configurations
 * Returns all scraping configurations or a paginated subset
 */
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/scraping/configurations: Request received");

    // Parse query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;

    console.log(
      `GET /api/scraping/configurations: Fetching configurations with limit=${limit}, offset=${offset}`,
    );

    // Use the storage function to get configurations
    const configs = await getScrapingConfigs(limit, offset);
    console.log(
      `GET /api/scraping/configurations: Retrieved ${configs.length} configurations`,
    );

    return NextResponse.json(configs, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Error in GET /api/scraping/configurations:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      {
        error: "Failed to retrieve scraping configurations",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}

/**
 * POST handler for scraping configurations
 * Saves a new scraping configuration
 */
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/scraping/configurations: Request received");

    // Parse the request body
    const body = await request.json();
    console.log("POST /api/scraping/configurations: Request body parsed", {
      url: body.url,
      name: body.name,
    });

    // Validate the request body
    if (!body || !body.url) {
      console.warn("POST /api/scraping/configurations: Invalid request body", {
        body,
      });
      return NextResponse.json(
        { error: "Invalid scraping configuration data" },
        { status: 400 },
      );
    }

    // Create a new scraping configuration
    const newConfig: ScrapingConfig = {
      ...body,
      id: body.id || generateUniqueId(), // Generate ID if not provided
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Use the storage function to save the configuration
    console.log(
      `POST /api/scraping/configurations: Saving configuration with ID=${newConfig.id}`,
    );
    const savedConfig = await saveScrapingConfig(newConfig);
    console.log(
      `POST /api/scraping/configurations: Configuration saved successfully with ID=${savedConfig.id}`,
    );

    return NextResponse.json(savedConfig, { status: 201 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Error in POST /api/scraping/configurations:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      { error: "Failed to save scraping configuration", details: errorMessage },
      { status: 500 },
    );
  }
}

/**
 * DELETE handler for scraping configurations
 * Deletes a specific configuration by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log("DELETE /api/scraping/configurations: Request received");

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    console.log(
      `DELETE /api/scraping/configurations: Request to delete configuration with ID=${id}`,
    );

    if (!id) {
      console.warn("DELETE /api/scraping/configurations: No ID provided");
      return NextResponse.json(
        { error: "Configuration ID is required" },
        { status: 400 },
      );
    }

    // Use the storage function to delete the configuration
    console.log(
      `DELETE /api/scraping/configurations: Attempting to delete configuration with ID=${id}`,
    );
    const success = await deleteScrapingConfig(id);

    if (!success) {
      console.warn(
        `DELETE /api/scraping/configurations: Configuration with ID=${id} not found or could not be deleted`,
      );
      return NextResponse.json(
        { error: "Configuration not found or could not be deleted" },
        { status: 404 },
      );
    }

    console.log(
      `DELETE /api/scraping/configurations: Configuration with ID=${id} deleted successfully`,
    );
    return NextResponse.json(
      { message: `Configuration ${id} deleted successfully` },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Error in DELETE /api/scraping/configurations:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      { error: "Failed to delete configuration", details: errorMessage },
      { status: 500 },
    );
  }
}
