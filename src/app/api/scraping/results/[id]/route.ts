/**
 * API route for a specific scraping result
 * Handles GET, PUT, and DELETE requests for a specific scraping result
 */

import { NextRequest, NextResponse } from "next/server";
import { scrapingResults } from "../route";
import {
  getScrapingResultById,
  saveScrapingResult,
  deleteScrapingResult,
} from "@/lib/scraping/storage";
import { ScrapingResult } from "@/types/scraping";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET handler for a specific scraping result
 * Returns the scraping result with the specified ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    console.log(`GET /api/scraping/results/${id}: Request received`);

    // Use the storage function to get the result by ID
    console.log(`GET /api/scraping/results/${id}: Fetching result`);
    const result = await getScrapingResultById(id);

    if (!result) {
      console.warn(`GET /api/scraping/results/${id}: Result not found`);
      return NextResponse.json(
        { error: "Scraping result not found" },
        { status: 404 },
      );
    }

    console.log(`GET /api/scraping/results/${id}: Result found and returned`);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error(`Error in GET /api/scraping/results/${params.id}:`, {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      { error: "Failed to retrieve scraping result", details: errorMessage },
      { status: 500 },
    );
  }
}

/**
 * PUT handler for a specific scraping result
 * Updates the scraping result with the specified ID
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    console.log(`PUT /api/scraping/results/${id}: Request received`);

    const body = await request.json();
    console.log(`PUT /api/scraping/results/${id}: Request body parsed`);

    // First, get the existing result
    console.log(`PUT /api/scraping/results/${id}: Fetching existing result`);
    const existingResult = await getScrapingResultById(id);

    if (!existingResult) {
      console.warn(`PUT /api/scraping/results/${id}: Result not found`);
      return NextResponse.json(
        { error: "Scraping result not found" },
        { status: 404 },
      );
    }

    // Update the result
    const updatedResult: ScrapingResult = {
      ...existingResult,
      ...body,
      id, // Ensure the ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    // Use the storage function to save the updated result
    console.log(`PUT /api/scraping/results/${id}: Saving updated result`);
    const savedResult = await saveScrapingResult(updatedResult);

    // Update the in-memory storage for backward compatibility
    const index = scrapingResults.findIndex((r) => r.id === id);
    if (index >= 0) {
      scrapingResults[index] = savedResult;
      console.log(
        `PUT /api/scraping/results/${id}: Updated in-memory storage at index ${index}`,
      );
    } else {
      console.log(
        `PUT /api/scraping/results/${id}: Result not found in in-memory storage`,
      );
    }

    console.log(`PUT /api/scraping/results/${id}: Result updated successfully`);
    return NextResponse.json(savedResult, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error(`Error in PUT /api/scraping/results/${params.id}:`, {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      { error: "Failed to update scraping result", details: errorMessage },
      { status: 500 },
    );
  }
}

/**
 * DELETE handler for a specific scraping result
 * Deletes the scraping result with the specified ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    console.log(`DELETE /api/scraping/results/${id}: Request received`);

    // Use the storage function to delete the result
    console.log(
      `DELETE /api/scraping/results/${id}: Attempting to delete result`,
    );
    const success = await deleteScrapingResult(id);

    if (!success) {
      console.warn(
        `DELETE /api/scraping/results/${id}: Result not found or could not be deleted`,
      );
      return NextResponse.json(
        { error: "Scraping result not found or could not be deleted" },
        { status: 404 },
      );
    }

    // Update the in-memory storage for backward compatibility
    const index = scrapingResults.findIndex((r) => r.id === id);
    if (index >= 0) {
      scrapingResults.splice(index, 1);
      console.log(
        `DELETE /api/scraping/results/${id}: Removed from in-memory storage at index ${index}`,
      );
    } else {
      console.log(
        `DELETE /api/scraping/results/${id}: Result not found in in-memory storage`,
      );
    }

    console.log(
      `DELETE /api/scraping/results/${id}: Result deleted successfully`,
    );
    return NextResponse.json(
      { message: "Scraping result deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error(`Error in DELETE /api/scraping/results/${params.id}:`, {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      { error: "Failed to delete scraping result", details: errorMessage },
      { status: 500 },
    );
  }
}
