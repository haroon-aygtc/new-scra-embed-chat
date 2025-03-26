import { NextRequest, NextResponse } from "next/server";
import { ScrapingConfig, ScrapingResult } from "@/types/scraping";
import { scrapeWebsite } from "@/lib/scraping/scraper";
import { saveScrapingResult } from "@/lib/scraping/storage";
import scrapingQueue from "@/lib/scraping/queue";

/**
 * API route handler for scraping operations
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body with error handling
    let config: ScrapingConfig;
    try {
      config = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    // Validate the configuration
    if (!config.url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(config.url);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 },
      );
    }

    // Check for potentially blocked domains
    const blockedDomains = [
      "localhost",
      "127.0.0.1",
      "example.com",
      "websimtest.test",
    ];
    const urlObj = new URL(config.url);
    const hostname = urlObj.hostname;

    if (blockedDomains.some((domain) => hostname.includes(domain))) {
      return NextResponse.json(
        {
          id: `warning_${Date.now()}`,
          configId: config.id || "manual",
          url: config.url,
          timestamp: new Date().toISOString(),
          status: "warning",
          categories: {},
          raw: {
            text: `The domain ${hostname} may be restricted. Consider using a public website for scraping.`,
          },
          metadata: {
            warnings: [
              `The domain ${hostname} may be restricted. Consider using a public website for scraping.`,
            ],
            version: "1.0.0",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { status: 200 },
      );
    }

    // Ensure options are properly set with defaults if missing
    if (!config.options) {
      config.options = {
        handleDynamicContent: true,
        followPagination: false,
        extractImages: true,
        deduplicateResults: true,
        maxPages: 5,
        skipHeadersFooters: false,
        skipImagesMedia: false,
        stealthMode: true,
        respectRobotsTxt: true,
        rateLimitDelay: 1000,
      };
    } else {
      // Ensure all options have default values if not provided
      config.options = {
        handleDynamicContent: config.options.handleDynamicContent ?? true,
        followPagination: config.options.followPagination ?? false,
        extractImages: config.options.extractImages ?? true,
        deduplicateResults: config.options.deduplicateResults ?? true,
        maxPages: config.options.maxPages ?? 5,
        skipHeadersFooters: config.options.skipHeadersFooters ?? false,
        skipImagesMedia: config.options.skipImagesMedia ?? false,
        stealthMode: config.options.stealthMode ?? true,
        respectRobotsTxt: config.options.respectRobotsTxt ?? true,
        rateLimitDelay: config.options.rateLimitDelay ?? 1000,
      };
    }

    // Ensure categories is an array
    if (!Array.isArray(config.categories)) {
      config.categories = [];
    }

    // Check if this should be queued for batch processing
    if (config.mode === "scheduled" || config.mode === "multiple") {
      // Add to queue instead of processing immediately
      const jobId = await scrapingQueue.addJob(config);

      return NextResponse.json(
        {
          jobId,
          message: `Scraping job added to queue. Check status at /api/scraping/queue?id=${jobId}`,
          status: "queued",
        },
        { status: 202 },
      ); // 202 Accepted
    }

    // Perform the scraping operation with timeout
    let result: ScrapingResult;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Scraping operation timed out")),
          60000,
        ); // 60 second timeout (increased from 45s)
      });

      result = (await Promise.race([
        scrapeWebsite(config),
        timeoutPromise,
      ])) as ScrapingResult;

      // Check if the result contains an error status from the scraper
      if (
        result.status === "error" ||
        (result.raw &&
          result.raw.text &&
          result.raw.text.includes("Error fetching content:"))
      ) {
        // Create a more user-friendly error message
        const errorMessage =
          result.raw?.text || "Access to the website was denied";
        result = {
          id: `error_${Date.now()}`,
          configId: config.id || "manual",
          url: config.url,
          timestamp: new Date().toISOString(),
          status: "failed",
          categories: {},
          raw: {
            text: errorMessage,
            html: result.raw?.html,
          },
          metadata: {
            errors: [errorMessage],
            suggestions: [
              "The website may have blocked the scraping request",
              "Try using a different URL or website",
              "The website may require authentication",
              "The website may have anti-bot protection",
              "Try enabling stealth mode in the advanced options",
              "Try increasing the rate limit delay in the advanced options",
            ],
            version: "1.0.0",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (scrapingError: any) {
      console.error("Scraping operation error:", scrapingError);

      // Create a failure result with more detailed information
      result = {
        id: `error_${Date.now()}`,
        configId: config.id || "manual",
        url: config.url,
        timestamp: new Date().toISOString(),
        status: "failed",
        categories: {},
        raw: {
          text: scrapingError.message || "Scraping operation failed",
        },
        metadata: {
          errors: [scrapingError.message || "Unknown error"],
          suggestions: [
            "The website may have blocked the scraping request",
            "Try using a different URL or website",
            "The website may require authentication",
            "The website may have anti-bot protection",
            "Try enabling stealth mode in the advanced options",
            "Try increasing the rate limit delay in the advanced options",
          ],
          version: "1.0.0",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Save the result
    const savedResult = await saveScrapingResult(result);

    // Set appropriate cache headers
    const headers = new Headers();
    headers.set("Cache-Control", "no-store, max-age=0");

    // Set CORS headers for cross-origin requests
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Return the result
    return NextResponse.json(savedResult, {
      status: 200, // Always return 200 to handle errors in the client
      headers,
    });
  } catch (error: any) {
    console.error("Scraping API error:", error);

    // Set CORS headers for cross-origin requests
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return NextResponse.json(
      {
        error: error.message || "Failed to perform scraping operation",
        suggestions: [
          "Check your request format and try again",
          "Ensure the URL is accessible and valid",
          "Try a different website if the issue persists",
          "Check your network connection",
          "The server may be experiencing high load, try again later",
        ],
      },
      { status: 500, headers },
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return new NextResponse(null, { status: 204, headers });
}
