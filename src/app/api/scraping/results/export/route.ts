/**
 * API route for exporting scraping results
 * Handles POST requests to export scraping results in various formats
 */

import { NextRequest, NextResponse } from "next/server";
import { ExportOptions } from "@/types/scraping";
import { exportScrapingResults } from "@/lib/scraping/storage";

/**
 * POST handler for exporting scraping results
 * Exports scraping results in the specified format
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const options: ExportOptions = await request.json();

    // Validate the request body
    if (!options || !options.format) {
      return NextResponse.json(
        { error: "Invalid export options" },
        { status: 400 },
      );
    }

    // Export the results
    const exportedData = await exportScrapingResults(options);

    // Set appropriate headers based on format
    const headers = new Headers();
    let filename = `scraping-export-${new Date().toISOString().split("T")[0]}`;

    switch (options.format) {
      case "json":
        headers.set("Content-Type", "application/json");
        filename += ".json";
        break;
      case "csv":
        headers.set("Content-Type", "text/csv");
        filename += ".csv";
        break;
      case "excel":
        headers.set("Content-Type", "application/vnd.ms-excel");
        filename += ".csv"; // Using CSV for Excel format
        break;
      case "pdf":
        headers.set("Content-Type", "application/pdf");
        filename += ".pdf";
        break;
      case "markdown":
        headers.set("Content-Type", "text/markdown");
        filename += ".md";
        break;
      case "html":
        headers.set("Content-Type", "text/html");
        filename += ".html";
        break;
      case "text":
        headers.set("Content-Type", "text/plain");
        filename += ".txt";
        break;
      default:
        headers.set("Content-Type", "application/json");
        filename += ".json";
    }

    // Set content disposition header for download
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);

    // Set CORS headers for cross-origin requests
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return NextResponse.json(exportedData, { headers });
  } catch (error: any) {
    console.error("Error in POST /api/scraping/results/export:", error);

    // Set CORS headers for cross-origin requests
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return NextResponse.json(
      { error: error.message || "Failed to export scraping results" },
      { status: 500, headers },
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
