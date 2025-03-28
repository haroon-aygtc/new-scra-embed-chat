import { NextRequest, NextResponse } from "next/server";
import {
  getScrapingConfigById,
  deleteScrapingConfig,
  saveScrapingConfig,
} from "@/lib/scraping/storage";
import { ScrapingConfig } from "@/types/scraping";

/**
 * API route handler for retrieving a specific scraping configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;
    console.log(`GET /api/scraping/configurations/${id}: Request received`);

    if (!id) {
      console.warn(`GET /api/scraping/configurations: Missing ID parameter`);
      return NextResponse.json(
        { error: "Configuration ID is required" },
        { status: 400 },
      );
    }

    // Use the storage function to get the configuration by ID
    console.log(
      `GET /api/scraping/configurations/${id}: Fetching configuration`,
    );
    const config = await getScrapingConfigById(id);

    if (!config) {
      console.warn(
        `GET /api/scraping/configurations/${id}: Configuration not found`,
      );
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 },
      );
    }

    console.log(
      `GET /api/scraping/configurations/${id}: Configuration found and returned`,
    );
    // Return the configuration
    return NextResponse.json(config);
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error";
    const errorStack = error.stack || "";

    console.error(`GET /api/scraping/configurations/${params.id}: Error:`, {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      {
        error: errorMessage || "Failed to retrieve configuration",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}

/**
 * API route handler for updating a specific scraping configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;
    console.log(`PUT /api/scraping/configurations/${id}: Request received`);

    const body = await request.json();
    console.log(`PUT /api/scraping/configurations/${id}: Request body parsed`);

    if (!id) {
      console.warn(`PUT /api/scraping/configurations: Missing ID parameter`);
      return NextResponse.json(
        { error: "Configuration ID is required" },
        { status: 400 },
      );
    }

    // Get the existing configuration
    console.log(
      `PUT /api/scraping/configurations/${id}: Fetching existing configuration`,
    );
    const existingConfig = await getScrapingConfigById(id);

    if (!existingConfig) {
      console.warn(
        `PUT /api/scraping/configurations/${id}: Configuration not found`,
      );
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 },
      );
    }

    // Update the configuration
    const updatedConfig: ScrapingConfig = {
      ...existingConfig,
      ...body,
      id, // Ensure the ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    // Save the updated configuration
    console.log(
      `PUT /api/scraping/configurations/${id}: Saving updated configuration`,
    );
    const savedConfig = await saveScrapingConfig(updatedConfig);
    console.log(
      `PUT /api/scraping/configurations/${id}: Configuration updated successfully`,
    );

    return NextResponse.json(savedConfig);
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error";
    const errorStack = error.stack || "";

    console.error(`PUT /api/scraping/configurations/${params.id}: Error:`, {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      {
        error: errorMessage || "Failed to update configuration",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}

/**
 * API route handler for deleting a scraping configuration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;
    console.log(`DELETE /api/scraping/configurations/${id}: Request received`);

    if (!id) {
      console.warn(`DELETE /api/scraping/configurations: Missing ID parameter`);
      return NextResponse.json(
        { error: "Configuration ID is required" },
        { status: 400 },
      );
    }

    // Get the configuration before deleting it (for the response)
    console.log(
      `DELETE /api/scraping/configurations/${id}: Fetching configuration before deletion`,
    );
    const configToDelete = await getScrapingConfigById(id);

    if (!configToDelete) {
      console.warn(
        `DELETE /api/scraping/configurations/${id}: Configuration not found`,
      );
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 },
      );
    }

    // Use the storage function to delete the configuration
    console.log(
      `DELETE /api/scraping/configurations/${id}: Attempting to delete configuration`,
    );
    const success = await deleteScrapingConfig(id);

    if (!success) {
      console.error(
        `DELETE /api/scraping/configurations/${id}: Failed to delete configuration`,
      );
      return NextResponse.json(
        { error: "Failed to delete configuration" },
        { status: 500 },
      );
    }

    console.log(
      `DELETE /api/scraping/configurations/${id}: Configuration deleted successfully`,
    );
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Configuration deleted successfully",
      id,
      deletedConfig: configToDelete,
    });
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error";
    const errorStack = error.stack || "";

    console.error(`DELETE /api/scraping/configurations/${params.id}: Error:`, {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      {
        error: errorMessage || "Failed to delete configuration",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
