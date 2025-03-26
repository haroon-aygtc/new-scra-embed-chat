import { NextRequest, NextResponse } from "next/server";
import { getScrapingResults as getResults } from "@/lib/scraping/storage";

/**
 * API route handler for retrieving scraping results
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

    // Retrieve the results with a timeout
    let results;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Database query timed out")), 5000); // 5 second timeout
      });

      results = await Promise.race([
        getResults(validLimit, validOffset),
        timeoutPromise,
      ]);
    } catch (dbError: any) {
      console.error("Database query error:", dbError);
      return NextResponse.json(
        { error: dbError.message || "Database query failed", results: [] },
        { status: 500 },
      );
    }

    // Return the results with proper caching headers
    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, max-age=10, stale-while-revalidate=30",
      },
    });
  } catch (error: any) {
    console.error("Get scraping results API error:", error);
    // Return empty array instead of error to make the UI more resilient
    return NextResponse.json(
      {
        error: error.message || "Failed to retrieve scraping results",
        results: [],
      },
      { status: 500 },
    );
  }
}
