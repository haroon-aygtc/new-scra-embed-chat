/**
 * API route for scraping analytics
 * Provides analytics data about scraping operations
 */

import { NextRequest, NextResponse } from "next/server";
import { getScrapingResults, getScrapingConfigs } from "@/lib/scraping/storage";

/**
 * GET handler for scraping analytics
 * Returns analytics data about scraping operations
 */
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/scraping/analytics: Request received");

    // Get all configurations and results
    // Wrap each call in its own try/catch to handle potential errors independently
    let configs = [];
    let results = [];

    try {
      configs = await getScrapingConfigs();
      console.log(
        `GET /api/scraping/analytics: Retrieved ${configs.length} configurations`,
      );
    } catch (configError) {
      console.error(
        "Error fetching scraping configs for analytics:",
        configError,
      );
      configs = [];
    }

    try {
      results = await getScrapingResults();
      console.log(
        `GET /api/scraping/analytics: Retrieved ${results.length} results`,
      );
    } catch (resultError) {
      console.error(
        "Error fetching scraping results for analytics:",
        resultError,
      );
      results = [];
    }

    // Calculate analytics
    const totalConfigs = configs.length;
    const totalResults = results.length;
    const successfulResults = results.filter(
      (r) => r.status === "success",
    ).length;
    const failedResults = results.filter((r) => r.status === "failed").length;
    const partialResults = results.filter((r) => r.status === "partial").length;
    const pendingResults = results.filter((r) => r.status === "pending").length;

    // Calculate success rate
    const successRate =
      totalResults > 0 ? (successfulResults / totalResults) * 100 : 0;

    // Get unique URLs
    const uniqueUrls = new Set();
    configs.forEach((config) => {
      uniqueUrls.add(config.url);
      if (config.urls && Array.isArray(config.urls)) {
        config.urls.forEach((url) => uniqueUrls.add(url));
      }
    });

    // Get modes distribution
    const modeDistribution = configs.reduce(
      (acc, config) => {
        const mode = config.mode || "unknown";
        acc[mode] = (acc[mode] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get categories distribution
    const categoriesDistribution = {};
    results.forEach((result) => {
      Object.keys(result.categories || {}).forEach((category) => {
        categoriesDistribution[category] =
          (categoriesDistribution[category] || 0) + 1;
      });
    });

    // Get recent activity
    const recentResults = [...results]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        configId: r.configId,
        url: r.url,
        timestamp: r.timestamp,
        status: r.status,
      }));

    // Return analytics data
    const analyticsData = {
      overview: {
        totalConfigurations: totalConfigs,
        totalResults: totalResults,
        successfulResults: successfulResults,
        failedResults: failedResults,
        partialResults: partialResults,
        pendingResults: pendingResults,
        successRate: successRate.toFixed(2) + "%",
        uniqueUrlsCount: uniqueUrls.size,
      },
      distributions: {
        modes: modeDistribution,
        categories: categoriesDistribution,
        statuses: {
          success: successfulResults,
          failed: failedResults,
          partial: partialResults,
          pending: pendingResults,
        },
      },
      recentActivity: recentResults,
    };

    console.log(
      "GET /api/scraping/analytics: Analytics data generated successfully",
    );
    return NextResponse.json(analyticsData, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Error in GET /api/scraping/analytics:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      { error: "Failed to generate analytics data", details: errorMessage },
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
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return new NextResponse(null, { status: 204, headers });
}
