/**
 * API route for categories
 * Handles GET and POST requests for scraping categories
 */

import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db/mysql";
import fs from "fs-extra";
import path from "path";
import { generateUniqueId } from "@/lib/utils/ids";

// Define categories directory
const CATEGORIES_DIR = path.join(process.cwd(), "data", "categories");

// Ensure categories directory exists
fs.ensureDirSync(CATEGORIES_DIR);

// Category interface
interface Category {
  id?: string;
  name: string;
  description: string;
  keywords: string[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * GET handler for categories
 * Returns all categories or a paginated subset
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;

    const categories: Category[] = [];

    // Try to get categories from MySQL database
    try {
      const query = limit
        ? `SELECT * FROM scraping_categories ORDER BY name ASC LIMIT ? OFFSET ?`
        : `SELECT * FROM scraping_categories ORDER BY name ASC`;

      const params = limit ? [limit, offset || 0] : [];
      const dbCategories = await executeQuery(query, params);

      if (Array.isArray(dbCategories) && dbCategories.length > 0) {
        // Parse JSON fields and add to categories
        for (const row of dbCategories) {
          categories.push({
            id: row.id,
            name: row.name,
            description: row.description,
            keywords: JSON.parse(row.keywords || "[]"),
            metadata: JSON.parse(row.metadata || "{}"),
            createdAt: row.created_at?.toISOString(),
            updatedAt: row.updated_at?.toISOString(),
          });
        }
        return NextResponse.json(categories);
      }
    } catch (dbError) {
      console.error("MySQL error getting categories:", dbError);
      // Fall back to file storage if database fails
    }

    // If no categories from database or database failed, try file storage
    const files = await fs.readdir(CATEGORIES_DIR);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    // Apply pagination if specified
    const paginatedFiles = limit
      ? jsonFiles.slice(offset || 0, (offset || 0) + limit)
      : jsonFiles;

    // Load each category
    for (const file of paginatedFiles) {
      const filePath = path.join(CATEGORIES_DIR, file);
      const category = await fs.readJson(filePath);
      categories.push(category);
    }

    // Sort by name
    categories.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Error in GET /api/scraping/categories:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve categories" },
      { status: 500 },
    );
  }
}

/**
 * POST handler for categories
 * Creates or updates a category
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const category: Category = await request.json();

    // Validate the request body
    if (!category || !category.name || !category.description) {
      return NextResponse.json(
        { error: "Invalid category data" },
        { status: 400 },
      );
    }

    // Ensure the category has an ID
    if (!category.id) {
      category.id = generateUniqueId();
    }

    // Ensure timestamps are set
    const now = new Date().toISOString();
    if (!category.createdAt) {
      category.createdAt = now;
    }
    category.updatedAt = now;

    // Save to MySQL database
    try {
      // Check if category already exists
      const existingCategory = await executeQuery(
        "SELECT id FROM scraping_categories WHERE name = ?",
        [category.name],
      );

      const keywordsJson = JSON.stringify(category.keywords || []);
      const metadataJson = JSON.stringify(category.metadata || {});

      if (Array.isArray(existingCategory) && existingCategory.length > 0) {
        // Update existing category
        await executeQuery(
          `UPDATE scraping_categories 
           SET description = ?, keywords = ?, metadata = ?, updated_at = ? 
           WHERE name = ?`,
          [
            category.description,
            keywordsJson,
            metadataJson,
            category.updatedAt,
            category.name,
          ],
        );
      } else {
        // Insert new category
        await executeQuery(
          `INSERT INTO scraping_categories 
           (id, name, description, keywords, metadata, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            category.id,
            category.name,
            category.description,
            keywordsJson,
            metadataJson,
            category.createdAt,
            category.updatedAt,
          ],
        );
      }
    } catch (dbError) {
      console.error("MySQL error saving category:", dbError);
      // Continue to file storage even if database fails
    }

    // Save to JSON file
    const filePath = path.join(
      CATEGORIES_DIR,
      `${category.name.toLowerCase()}.json`,
    );
    await fs.writeJson(filePath, category, { spaces: 2 });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/scraping/categories:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save category" },
      { status: 500 },
    );
  }
}
