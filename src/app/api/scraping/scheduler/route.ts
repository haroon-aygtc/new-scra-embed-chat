/**
 * API route for managing the synchronization scheduler
 * Handles POST requests to start/stop the synchronization scheduler
 */

import { NextRequest, NextResponse } from "next/server";
import scheduler from "@/lib/scraping/scheduler";

/**
 * POST handler for managing the synchronization scheduler
 * Starts or stops the synchronization scheduler
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate the request body
    if (!body || body.action === undefined) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // Handle the action
    switch (body.action) {
      case "start":
        scheduler.startSyncScheduler(body.interval);
        return NextResponse.json({
          success: true,
          message: "Synchronization scheduler started",
          interval: body.interval || "default",
        });
      case "stop":
        scheduler.stopSyncScheduler();
        return NextResponse.json({
          success: true,
          message: "Synchronization scheduler stopped",
        });
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/scraping/scheduler:", error);
    return NextResponse.json(
      { error: error.message || "Failed to manage synchronization scheduler" },
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
