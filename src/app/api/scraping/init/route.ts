/**
 * API route for initializing the scraping module
 * Handles POST requests to initialize the database and file storage
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeAllTables } from "@/lib/db/init";
import { initializeFileStorage } from "@/lib/db/fileStorage";
import { initializeDatabase } from "@/lib/db/mysql";
import scheduler from "@/lib/scraping/scheduler";
import { syncAll } from "@/lib/scraping/sync";

/**
 * POST handler for initializing the scraping module
 * Initializes the database and file storage
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    let body: { startSync?: boolean; syncInterval?: number } = {};
    try {
      body = await request.json();
    } catch (parseError) {
      // If no body is provided, use defaults
      body = {};
    }

    // Initialize MySQL database
    await initializeDatabase();

    // Initialize all tables
    const dbSuccess = await initializeAllTables();

    // Initialize file storage
    await initializeFileStorage();

    // Synchronize data between MySQL and JSON files
    const syncResult = await syncAll();

    // Start the synchronization scheduler if requested
    if (body.startSync !== false) {
      scheduler.startSyncScheduler(body.syncInterval);
    }

    return NextResponse.json({
      success: true,
      message: "Scraping module initialized successfully",
      details: {
        database: dbSuccess ? "initialized" : "failed",
        fileStorage: "initialized",
        sync: {
          configurations: syncResult.configurations,
          results: syncResult.results,
        },
        scheduler: body.startSync !== false ? "started" : "not started",
      },
    });
  } catch (error: any) {
    console.error("Error in POST /api/scraping/init:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to initialize scraping module",
        success: false,
      },
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
