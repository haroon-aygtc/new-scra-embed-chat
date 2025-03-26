import { NextRequest, NextResponse } from "next/server";
import { getScrapingResultById } from "@/lib/scraping/storage";

/**
 * API route handler for retrieving a specific scraping result
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "Result ID is required" },
        { status: 400 },
      );
    }

    // Retrieve the result
    const result = await getScrapingResultById(id);

    if (!result) {
      return NextResponse.json(
        { error: "Scraping result not found" },
        { status: 404 },
      );
    }

    // Return the result
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Get scraping result API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve scraping result" },
      { status: 500 },
    );
  }
}
