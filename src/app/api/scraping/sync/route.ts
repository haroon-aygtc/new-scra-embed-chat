/**
 * API route for data synchronization
 * Handles POST requests to synchronize data between MySQL and JSON files
 */

import { NextRequest, NextResponse } from "next/server";
import { syncAll, syncConfigurations, syncResults } from "@/lib/scraping/sync";

/**
 * POST handler for data synchronization
 * Synchronizes data between MySQL and JSON files
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    let body: { type?: string } = {};
    try {
      body = await request.json();
    } catch (parseError) {
      // If no body is provided, default to syncing all data
      body = {};
    }

    const type = body.type || "all";

    // Synchronize data based on the type
    switch (type) {
      case "configurations":
        const configCount = await syncConfigurations();
        return NextResponse.json({
          success: true,
          message: `Synchronized ${configCount} configurations`,
          count: configCount,
        });
      case "results":
        const resultCount = await syncResults();
        return NextResponse.json({
          success: true,
          message: `Synchronized ${resultCount} results`,
          count: resultCount,
        });
      case "all":
      default:
        const syncResult = await syncAll();
        return NextResponse.json({
          success: true,
          message: `Synchronized ${syncResult.configurations} configurations and ${syncResult.results} results`,
          counts: syncResult,
        });
    }
  } catch (error: any) {
    console.error("Error in POST /api/scraping/sync:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synchronize data" },
      { status: 500 },
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return new NextResponse(null, { status: 204, headers });
}
