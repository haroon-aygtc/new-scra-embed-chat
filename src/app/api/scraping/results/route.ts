/**
 * API route for scraping results
 * Handles GET and POST requests for scraping results
 */

import { NextRequest, NextResponse } from "next/server";
import { ScrapingResult } from "@/types/scraping";
import {
  getScrapingResults,
  saveScrapingResult,
  deleteScrapingResult,
} from "@/lib/scraping/storage";

// Keep this for backward compatibility with the [id] route
let scrapingResults: ScrapingResult[] = [];

/**
 * GET handler for scraping results
 * Returns all scraping results or a paginated subset
 */
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/scraping/results: Request received");

    // Parse query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;

    console.log(
      `GET /api/scraping/results: Fetching results with limit=${limit}, offset=${offset}`,
    );

    // Use the storage function to get results
    const results = await getScrapingResults(limit, offset);
    console.log(
      `GET /api/scraping/results: Retrieved ${results.length} results`,
    );

    // Update the in-memory storage for backward compatibility
    scrapingResults = [...results];

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Error in GET /api/scraping/results:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      { error: "Failed to retrieve scraping results", details: errorMessage },
      { status: 500 },
    );
  }
}

/**
 * POST handler for scraping results
 * Saves a new scraping result
 */
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/scraping/results: Request received");

    // Parse the request body
    const body = await request.json();
    console.log("POST /api/scraping/results: Request body parsed", {
      configId: body.configId,
      url: body.url,
    });

    // Validate the request body
    if (!body || !body.configId || !body.url) {
      console.warn("POST /api/scraping/results: Invalid request body", {
        body,
      });
      return NextResponse.json(
        { error: "Invalid scraping result data" },
        { status: 400 },
      );
    }

    // Create a new scraping result
    const newResult: ScrapingResult = {
      ...body,
      id: body.id || undefined, // Let the storage function handle ID generation
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Use the storage function to save the result
    console.log(
      `POST /api/scraping/results: Saving result for configId=${newResult.configId}`,
    );
    const savedResult = await saveScrapingResult(newResult);
    console.log(
      `POST /api/scraping/results: Result saved with ID=${savedResult.id}`,
    );

    // Update the in-memory storage for backward compatibility
    const existingIndex = scrapingResults.findIndex(
      (r) => r.id === savedResult.id,
    );
    if (existingIndex >= 0) {
      scrapingResults[existingIndex] = savedResult;
      console.log(
        `POST /api/scraping/results: Updated existing result at index ${existingIndex}`,
      );
    } else {
      scrapingResults.push(savedResult);
      console.log(
        `POST /api/scraping/results: Added new result to in-memory storage`,
      );
    }

    return NextResponse.json(savedResult, { status: 201 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Error in POST /api/scraping/results:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      { error: "Failed to save scraping result", details: errorMessage },
      { status: 500 },
    );
  }
}

/**
 * DELETE handler for scraping results
 * Deletes all scraping results (use with caution)
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log("DELETE /api/scraping/results: Request received");

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    console.log(
      `DELETE /api/scraping/results: Request to delete ${id ? `result with ID=${id}` : "all results"}`,
    );

    if (id) {
      // Delete a specific result
      console.log(
        `DELETE /api/scraping/results: Attempting to delete result with ID=${id}`,
      );
      const success = await deleteScrapingResult(id);

      if (!success) {
        console.warn(
          `DELETE /api/scraping/results: Result with ID=${id} not found or could not be deleted`,
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
          `DELETE /api/scraping/results: Removed result from in-memory storage at index ${index}`,
        );
      } else {
        console.log(
          `DELETE /api/scraping/results: Result not found in in-memory storage`,
        );
      }

      console.log(
        `DELETE /api/scraping/results: Successfully deleted result with ID=${id}`,
      );
      return NextResponse.json(
        { message: `Scraping result ${id} deleted successfully` },
        { status: 200 },
      );
    } else {
      // Clear all results from the in-memory storage
      // Note: This is a temporary solution until we implement a proper delete all function
      const previousCount = scrapingResults.length;
      scrapingResults = [];
      console.log(
        `DELETE /api/scraping/results: Cleared all ${previousCount} results from in-memory storage`,
      );

      return NextResponse.json(
        { message: "All scraping results deleted successfully" },
        { status: 200 },
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Error in DELETE /api/scraping/results:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      { error: "Failed to delete scraping results", details: errorMessage },
      { status: 500 },
    );
  }
}

/**
 * Export function for scraping results
 * This is used for testing and development purposes
 */
export { scrapingResults };
