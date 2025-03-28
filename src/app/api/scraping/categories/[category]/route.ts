/**
 * API route for category information
 * Handles GET requests for category descriptions and metadata
 */

import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db/mysql";
import fs from "fs-extra";
import path from "path";

// Define categories directory
const CATEGORIES_DIR = path.join(process.cwd(), "data", "categories");

// Ensure categories directory exists
fs.ensureDirSync(CATEGORIES_DIR);

// Default category descriptions
const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  services: "Services offered by the organization",
  fees: "Pricing and fee structure",
  documents: "Required documents and forms",
  eligibility: "Eligibility criteria for services",
  products: "Products available for purchase",
  contact: "Contact information and support details",
  faq: "Frequently asked questions and answers",
  hours: "Business hours and availability",
  locations: "Physical locations and addresses",
  team: "Team members and staff information",
  testimonials: "Customer reviews and testimonials",
};

/**
 * GET handler for category information
 * Returns information about a specific category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } },
) {
  try {
    const category = params.category.toLowerCase();

    // Try to get category from MySQL database
    try {
      const dbCategories = await executeQuery(
        "SELECT * FROM scraping_categories WHERE name = ?",
        [category],
      );

      if (Array.isArray(dbCategories) && dbCategories.length > 0) {
        const row = dbCategories[0];
        return NextResponse.json({
          name: row.name,
          description: row.description,
          keywords: JSON.parse(row.keywords || "[]"),
          metadata: JSON.parse(row.metadata || "{}"),
        });
      }
    } catch (dbError) {
      console.error(`MySQL error getting category ${category}:`, dbError);
      // Fall back to file storage if database fails
    }

    // If not found in database or database failed, try file storage
    const filePath = path.join(CATEGORIES_DIR, `${category}.json`);
    if (await fs.pathExists(filePath)) {
      const categoryData = await fs.readJson(filePath);
      return NextResponse.json(categoryData);
    }

    // If not found in file storage, return default description
    if (DEFAULT_DESCRIPTIONS[category]) {
      return NextResponse.json({
        name: category,
        description: DEFAULT_DESCRIPTIONS[category],
        keywords: [],
        metadata: {},
      });
    }

    // If category not found, return generic description
    return NextResponse.json({
      name: category,
      description: `Information about ${category}`,
      keywords: [],
      metadata: {},
    });
  } catch (error: any) {
    console.error(
      `Error in GET /api/scraping/categories/${params.category}:`,
      error,
    );
    return NextResponse.json(
      { error: error.message || "Failed to retrieve category information" },
      { status: 500 },
    );
  }
}
