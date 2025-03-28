import {
  ScrapingConfig,
  ScrapingResult,
  CategoryData,
  CategoryItem,
} from "@/types/scraping";
import { generateUniqueId } from "@/lib/utils/ids";
import { categorizeContent } from "./categorization";

/**
 * Main function to scrape a website based on the provided configuration
 */
export async function scrapeWebsite(
  config: ScrapingConfig,
): Promise<ScrapingResult> {
  // Apply the appropriate scraping strategy based on the scraping mode
  if (config.scrapingMode === "thorough") {
    return scrapeWebsiteThorough(config);
  } else if (config.scrapingMode === "semantic") {
    return scrapeWebsiteSemantic(config);
  }

  // Default to basic scraping if not specified or "basic"
  return scrapeWebsiteBasic(config);
}

/**
 * Basic scraping mode - fast, surface-level extraction
 */
async function scrapeWebsiteBasic(
  config: ScrapingConfig,
): Promise<ScrapingResult> {
  const startTime = Date.now();
  const resultId = generateUniqueId();

  try {
    // Fetch the HTML content
    const { html, text, error, status } = await fetchWebsiteContent(
      config.url,
      config.options.handleDynamicContent,
      config.options,
    );

    // Check if there was an error during fetching
    if (status === "error" || error) {
      return {
        id: resultId,
        configId: config.id || "manual",
        url: config.url,
        timestamp: new Date().toISOString(),
        status: "failed",
        categories: {},
        raw: {
          text: error || "Unknown error occurred",
          html: html,
        },
        metadata: {
          processingTime: Date.now() - startTime,
          errors: [error || "Unknown error occurred"],
          version: "1.0.0",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Extract raw data based on the configuration
    const rawData = await extractRawData(html, text, config);

    // Categorize the content
    const categorizedData = await categorizeContent(rawData, config.categories);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Create the result object
    const result: ScrapingResult = {
      id: resultId,
      configId: config.id || "manual",
      url: config.url,
      timestamp: new Date().toISOString(),
      status: "success",
      categories: categorizedData,
      raw: {
        json: JSON.stringify(rawData.structured, null, 2),
        html: rawData.html,
        text: rawData.text,
      },
      metadata: {
        processingTime,
        pageCount: config.options.followPagination
          ? Math.min(rawData.pageCount || 1, config.options.maxPages)
          : 1,
        elementCount: rawData.elementCount || 0,
        errors: rawData.errors || [],
        warnings: rawData.warnings || [],
        version: "1.0.0",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return result;
  } catch (error: any) {
    console.error("Scraping error:", error);

    // Return a failed result
    return {
      id: resultId,
      configId: config.id || "manual",
      url: config.url,
      timestamp: new Date().toISOString(),
      status: "failed",
      categories: {},
      raw: {
        text: error.message,
      },
      metadata: {
        processingTime: Date.now() - startTime,
        errors: [error.message],
        version: "1.0.0",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Thorough scraping mode - deeper extraction with structure
 */
async function scrapeWebsiteThorough(
  config: ScrapingConfig,
): Promise<ScrapingResult> {
  const startTime = Date.now();
  const resultId = generateUniqueId();

  try {
    // Fetch the HTML content
    const { html, text, error, status } = await fetchWebsiteContent(
      config.url,
      config.options.handleDynamicContent,
      config.options,
    );

    // Check if there was an error during fetching
    if (status === "error" || error) {
      return {
        id: resultId,
        configId: config.id || "manual",
        url: config.url,
        timestamp: new Date().toISOString(),
        status: "failed",
        categories: {},
        raw: {
          text: error || "Unknown error occurred",
          html: html,
        },
        metadata: {
          processingTime: Date.now() - startTime,
          errors: [error || "Unknown error occurred"],
          version: "1.0.0",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Extract raw data with more comprehensive parsing
    const rawData = await extractRawDataThorough(html, text, config);

    // Categorize the content with more detailed analysis
    const categorizedData = await categorizeContent(rawData, config.categories);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Create the result object
    const result: ScrapingResult = {
      id: resultId,
      configId: config.id || "manual",
      url: config.url,
      timestamp: new Date().toISOString(),
      status: "success",
      categories: categorizedData,
      raw: {
        json: JSON.stringify(rawData.structured, null, 2),
        html: rawData.html,
        text: rawData.text,
      },
      metadata: {
        processingTime,
        pageCount: config.options.followPagination
          ? Math.min(rawData.pageCount || 1, config.options.maxPages)
          : 1,
        elementCount: rawData.elementCount || 0,
        errors: rawData.errors || [],
        warnings: rawData.warnings || [],
        version: "1.0.0",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return result;
  } catch (error: any) {
    console.error("Thorough scraping error:", error);

    // Return a failed result
    return {
      id: resultId,
      configId: config.id || "manual",
      url: config.url,
      timestamp: new Date().toISOString(),
      status: "failed",
      categories: {},
      raw: {
        text: error.message,
      },
      metadata: {
        processingTime: Date.now() - startTime,
        errors: [error.message],
        version: "1.0.0",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Semantic scraping mode - AI-powered content understanding
 */
async function scrapeWebsiteSemantic(
  config: ScrapingConfig,
): Promise<ScrapingResult> {
  const startTime = Date.now();
  const resultId = generateUniqueId();

  try {
    // Fetch the HTML content
    const { html, text, error, status } = await fetchWebsiteContent(
      config.url,
      config.options.handleDynamicContent,
      config.options,
    );

    // Check if there was an error during fetching
    if (status === "error" || error) {
      return {
        id: resultId,
        configId: config.id || "manual",
        url: config.url,
        timestamp: new Date().toISOString(),
        status: "failed",
        categories: {},
        raw: {
          text: error || "Unknown error occurred",
          html: html,
        },
        metadata: {
          processingTime: Date.now() - startTime,
          errors: [error || "Unknown error occurred"],
          version: "1.0.0",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Extract raw data with semantic understanding
    const rawData = await extractRawDataSemantic(html, text, config);

    // Categorize the content with AI-powered analysis
    const categorizedData = await categorizeContent(rawData, config.categories);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Create the result object
    const result: ScrapingResult = {
      id: resultId,
      configId: config.id || "manual",
      url: config.url,
      timestamp: new Date().toISOString(),
      status: "success",
      categories: categorizedData,
      raw: {
        json: JSON.stringify(rawData.structured, null, 2),
        html: rawData.html,
        text: rawData.text,
      },
      metadata: {
        processingTime,
        pageCount: config.options.followPagination
          ? Math.min(rawData.pageCount || 1, config.options.maxPages)
          : 1,
        elementCount: rawData.elementCount || 0,
        errors: rawData.errors || [],
        warnings: rawData.warnings || [],
        version: "1.0.0",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return result;
  } catch (error: any) {
    console.error("Semantic scraping error:", error);

    // Return a failed result
    return {
      id: resultId,
      configId: config.id || "manual",
      url: config.url,
      timestamp: new Date().toISOString(),
      status: "failed",
      categories: {},
      raw: {
        text: error.message,
      },
      metadata: {
        processingTime: Date.now() - startTime,
        errors: [error.message],
        version: "1.0.0",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Fetches the HTML content of a website
 */
async function fetchWebsiteContent(
  url: string,
  handleDynamicContent: boolean,
  options?: any,
) {
  // Check robots.txt if enabled in config
  if (options?.respectRobotsTxt) {
    try {
      const robotsUrl = new URL("/robots.txt", url).toString();
      const robotsResponse = await fetch(robotsUrl, {
        method: "GET",
        cache: "no-store",
      });
      if (robotsResponse.ok) {
        const robotsTxt = await robotsResponse.text();
        if (isUrlDisallowedByRobotsTxt(robotsTxt, url)) {
          return {
            html: `<html><body><p>Access disallowed by robots.txt</p></body></html>`,
            text: `Access disallowed by robots.txt`,
            error: "Access disallowed by robots.txt",
            status: "error",
          };
        }
      }
    } catch (robotsError) {
      console.warn(`Could not check robots.txt for ${url}:`, robotsError);
      // Continue with the request even if robots.txt check fails
    }
  }

  try {
    // For dynamic content, we would use a headless browser like Puppeteer
    // For this implementation, we'll use fetch for static content
    // Use a CORS proxy for external URLs in development environments
    let proxyUrl = url;
    const isProduction = process.env.NODE_ENV === "production";

    // In production, we might use a different proxy or direct connection
    if (
      !isProduction &&
      !url.includes("localhost") &&
      !url.startsWith("/api/")
    ) {
      // Use a CORS proxy in development
      const corsProxyUrl = process.env.NEXT_PUBLIC_CORS_PROXY_URL;
      if (corsProxyUrl) {
        proxyUrl = `${corsProxyUrl}${encodeURIComponent(url)}`;
      }
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Generate a random delay if rate limiting is enabled
      if (options?.rateLimitDelay) {
        const delay =
          typeof options.rateLimitDelay === "number"
            ? options.rateLimitDelay
            : Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Use a more comprehensive set of headers to mimic a real browser
      const headers: Record<string, string> = {
        "User-Agent": options?.stealthMode
          ? getRandomUserAgent()
          : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
      };

      // Add a referer for stealth mode to appear more legitimate
      if (options?.stealthMode) {
        headers["Referer"] = getRandomReferer();
      }

      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers,
        // Add credentials to handle cookies if needed
        credentials: "omit",
        // Use GET method explicitly
        method: "GET",
        // Disable cache to get fresh content
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Create a more detailed error message
        throw new Error(
          `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
        );
      }

      const html = await response.text();

      // Extract text content from HTML
      const text = extractTextFromHtml(html);

      return { html, text };
    } catch (fetchError: any) {
      if (fetchError.name === "AbortError") {
        throw new Error(`Request timeout for ${url}`);
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    console.error("Error fetching website content:", error);

    // Return a more structured error response instead of throwing
    return {
      html: `<html><body><p>Error fetching content: ${error.message}</p></body></html>`,
      text: `Error fetching content: ${error.message}`,
      error: error.message,
      status: "error",
    };
  }
}

/**
 * Checks if a URL is disallowed by robots.txt
 */
function isUrlDisallowedByRobotsTxt(robotsTxt: string, url: string): boolean {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const lines = robotsTxt.split("\n");

    let isUserAgentRelevant = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check for user agent
      if (trimmedLine.startsWith("User-agent:")) {
        const userAgent = trimmedLine.substring("User-agent:".length).trim();
        isUserAgentRelevant =
          userAgent === "*" || userAgent.toLowerCase() === "mozilla";
      }

      // Check for disallow rules if we're in a relevant user agent section
      if (isUserAgentRelevant && trimmedLine.startsWith("Disallow:")) {
        const disallowPath = trimmedLine.substring("Disallow:".length).trim();

        // Empty disallow means everything is allowed
        if (disallowPath === "") continue;

        // Check if the path matches the disallow rule
        if (path.startsWith(disallowPath)) {
          return true; // URL is disallowed
        }
      }
    }

    return false; // URL is allowed
  } catch (error) {
    console.error("Error parsing robots.txt:", error);
    return false; // Default to allowing if there's an error
  }
}

/**
 * Returns a random user agent string to avoid detection
 */
function getRandomUserAgent(): string {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ];

  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Returns a random referer to make requests look more legitimate
 */
function getRandomReferer(): string {
  const referers = [
    "https://www.google.com/",
    "https://www.bing.com/",
    "https://search.yahoo.com/",
    "https://duckduckgo.com/",
    "https://www.facebook.com/",
    "https://twitter.com/",
    "https://www.linkedin.com/",
  ];

  return referers[Math.floor(Math.random() * referers.length)];
}

/**
 * Extracts text content from HTML
 */
function extractTextFromHtml(html: string): string {
  try {
    // In a production environment, we would use a proper HTML parser
    // For this implementation, we'll use a simple regex approach with error handling
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return text;
  } catch (error) {
    console.error("Error extracting text from HTML:", error);
    return "Error extracting text content";
  }
}

/**
 * Extracts raw data from HTML based on the configuration (Basic mode)
 */
async function extractRawData(
  html: string,
  text: string,
  config: ScrapingConfig,
) {
  try {
    let structured: any = {};
    let pageCount = 1;
    let elementCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract data based on selector type
    if (config.selectorType === "css") {
      // In a production environment, we would use a proper HTML parser like Cheerio
      // For this implementation, we'll create a simple structured object
      structured = extractStructuredData(html, config.selector);
      elementCount = Object.keys(structured).length;
    } else if (config.selectorType === "xpath") {
      // XPath extraction would be implemented here
      warnings.push(
        "XPath extraction is not fully implemented in this version",
      );
      structured = { warning: "XPath extraction simulation" };
    } else if (config.selectorType === "auto") {
      // Auto-detection would be implemented here
      warnings.push("Auto-detection is not fully implemented in this version");
      structured = autoDetectStructure(html, text, config.categories);
    }

    // Handle pagination if enabled
    if (
      config.options.followPagination &&
      pageCount < config.options.maxPages
    ) {
      warnings.push("Pagination is not fully implemented in this version");
    }

    // Handle image extraction if enabled
    if (config.options.extractImages) {
      structured.images = extractImages(html);
    }

    // Handle deduplication if enabled
    if (config.options.deduplicateResults) {
      // Deduplication would be implemented here
      warnings.push("Deduplication is not fully implemented in this version");
    }

    // Apply skip headers & footers if enabled
    if (config.options.skipHeadersFooters) {
      text = skipHeadersAndFooters(text);
    }

    // Apply skip images & media if enabled
    if (config.options.skipImagesMedia) {
      structured = removeImagesAndMedia(structured);
    }

    return {
      html,
      text,
      structured,
      pageCount,
      elementCount,
      errors,
      warnings,
    };
  } catch (error: any) {
    console.error("Error extracting raw data:", error);
    return {
      html,
      text,
      structured: { error: error.message },
      pageCount: 0,
      elementCount: 0,
      errors: [error.message],
      warnings: [],
    };
  }
}

/**
 * Extracts structured data from HTML using CSS selectors
 */
function extractStructuredData(html: string, selector: string) {
  try {
    // In a production environment, we would use a proper HTML parser like Cheerio
    // For this implementation, we'll create a simple structured object based on the HTML

    // This is a simplified simulation of structured data extraction
    const structured: any = {
      title: extractTitle(html),
      description: extractMetaDescription(html),
      content: {},
    };

    // Simulate extracting content based on the selector
    if (selector === ".content" || selector === "*") {
      structured.content = {
        paragraphs: extractParagraphs(html),
        headings: extractHeadings(html),
        lists: extractLists(html),
      };
    }

    return structured;
  } catch (error: any) {
    console.error("Error extracting structured data:", error);
    return {
      title: "Error extracting data",
      description: error.message,
      content: {},
    };
  }
}

/**
 * Extracts the title from HTML
 */
function extractTitle(html: string): string {
  try {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : "";
  } catch (error) {
    return "";
  }
}

/**
 * Extracts the meta description from HTML
 */
function extractMetaDescription(html: string): string {
  try {
    const metaMatch =
      html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i,
      );
    return metaMatch ? metaMatch[1].trim() : "";
  } catch (error) {
    return "";
  }
}

/**
 * Extracts paragraphs from HTML
 */
function extractParagraphs(html: string): string[] {
  try {
    const paragraphs: string[] = [];
    const regex = /<p[^>]*>([^<]+)<\/p>/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
      paragraphs.push(match[1].trim());
    }

    return paragraphs;
  } catch (error) {
    return [];
  }
}

/**
 * Extracts headings from HTML
 */
function extractHeadings(html: string): Record<string, string[]> {
  try {
    const headings: Record<string, string[]> = {
      h1: [],
      h2: [],
      h3: [],
    };

    for (let i = 1; i <= 3; i++) {
      const regex = new RegExp(`<h${i}[^>]*>([^<]+)<\/h${i}>`, "gi");
      let match;

      while ((match = regex.exec(html)) !== null) {
        headings[`h${i}`].push(match[1].trim());
      }
    }

    return headings;
  } catch (error) {
    return { h1: [], h2: [], h3: [] };
  }
}

/**
 * Extracts lists from HTML
 */
function extractLists(html: string): string[][] {
  try {
    const lists: string[][] = [];
    const listRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
    const itemRegex = /<li[^>]*>([^<]+)<\/li>/gi;

    let listMatch;
    while ((listMatch = listRegex.exec(html)) !== null) {
      const items: string[] = [];
      const listContent = listMatch[1];

      let itemMatch;
      while ((itemMatch = itemRegex.exec(listContent)) !== null) {
        items.push(itemMatch[1].trim());
      }

      if (items.length > 0) {
        lists.push(items);
      }
    }

    return lists;
  } catch (error) {
    return [];
  }
}

/**
 * Extracts images from HTML
 */
function extractImages(html: string): { src: string; alt: string }[] {
  try {
    const images: { src: string; alt: string }[] = [];
    const regex =
      /<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
      images.push({
        src: match[1],
        alt: match[2] || "",
      });
    }

    return images;
  } catch (error) {
    return [];
  }
}

/**
 * Extracts raw data with more comprehensive parsing (Thorough mode)
 */
async function extractRawDataThorough(
  html: string,
  text: string,
  config: ScrapingConfig,
) {
  try {
    // Start with basic extraction
    const basicData = await extractRawData(html, text, config);

    // Enhance with more detailed structure
    const enhancedStructured = enhanceStructuredData(
      basicData.structured,
      html,
    );

    return {
      ...basicData,
      structured: enhancedStructured,
      elementCount: countElements(enhancedStructured),
    };
  } catch (error: any) {
    console.error("Error extracting thorough raw data:", error);
    return {
      html,
      text,
      structured: { error: error.message },
      pageCount: 0,
      elementCount: 0,
      errors: [error.message],
      warnings: [],
    };
  }
}

/**
 * Extracts raw data with semantic understanding (Semantic mode)
 */
async function extractRawDataSemantic(
  html: string,
  text: string,
  config: ScrapingConfig,
) {
  try {
    // Start with thorough extraction
    const thoroughData = await extractRawDataThorough(html, text, config);

    // Enhance with semantic understanding
    // In a production environment, this would use NLP and ML techniques
    const semanticStructured = addSemanticUnderstanding(
      thoroughData.structured,
      text,
    );

    return {
      ...thoroughData,
      structured: semanticStructured,
    };
  } catch (error: any) {
    console.error("Error extracting semantic raw data:", error);
    return {
      html,
      text,
      structured: { error: error.message },
      pageCount: 0,
      elementCount: 0,
      errors: [error.message],
      warnings: [],
    };
  }
}

/**
 * Enhances structured data with more detailed parsing
 */
function enhanceStructuredData(structured: any, html: string): any {
  // In a production environment, this would use more sophisticated parsing
  // For this implementation, we'll add some additional fields

  return {
    ...structured,
    enhanced: true,
    metadata: {
      pageStructure: analyzePageStructure(html),
      contentDensity: analyzeContentDensity(html),
      semanticStructure: extractSemanticStructure(html),
    },
    relationships: identifyRelationships(structured),
  };
}

/**
 * Adds semantic understanding to structured data
 */
function addSemanticUnderstanding(structured: any, text: string): any {
  // In a production environment, this would use NLP and ML techniques
  // For this implementation, we'll add some simulated semantic fields

  return {
    ...structured,
    semantic: true,
    topics: extractTopics(text),
    sentiment: analyzeSentiment(text),
    entities: extractEntities(text),
    summary: generateSummary(text),
  };
}

/**
 * Analyzes the structure of the page
 */
function analyzePageStructure(html: string): any {
  // Simplified implementation
  return {
    sections: countSections(html),
    navigation: hasNavigation(html),
    footer: hasFooter(html),
    sidebar: hasSidebar(html),
  };
}

/**
 * Analyzes the content density of the page
 */
function analyzeContentDensity(html: string): any {
  // Simplified implementation
  return {
    textToCodeRatio: calculateTextToCodeRatio(html),
    contentDensity: "medium",
  };
}

/**
 * Extracts the semantic structure of the page
 */
function extractSemanticStructure(html: string): any {
  // Simplified implementation
  return {
    mainContent: identifyMainContent(html),
    supportingContent: identifySupportingContent(html),
  };
}

/**
 * Identifies relationships between content elements
 */
function identifyRelationships(structured: any): any {
  // Simplified implementation
  return {
    hierarchical: true,
    related: ["services", "pricing"],
  };
}

/**
 * Extracts topics from text
 */
function extractTopics(text: string): string[] {
  // Simplified implementation
  return ["web development", "services", "pricing"];
}

/**
 * Analyzes sentiment of text
 */
function analyzeSentiment(text: string): any {
  // Simplified implementation
  return {
    overall: "positive",
    score: 0.75,
  };
}

/**
 * Extracts entities from text
 */
function extractEntities(text: string): any[] {
  // Simplified implementation
  return [
    { type: "organization", name: "Example Corp", confidence: 0.9 },
    { type: "service", name: "Web Development", confidence: 0.85 },
  ];
}

/**
 * Generates a summary of text
 */
function generateSummary(text: string): string {
  // Simplified implementation
  return text.length > 200 ? text.substring(0, 200) + "..." : text;
}

/**
 * Counts sections in HTML
 */
function countSections(html: string): number {
  // Simplified implementation
  const sectionMatches = html.match(/<section|<div[^>]*class="[^"]*section/gi);
  return sectionMatches ? sectionMatches.length : 0;
}

/**
 * Checks if HTML has navigation
 */
function hasNavigation(html: string): boolean {
  // Simplified implementation
  return html.includes("<nav") || html.includes('class="navigation"');
}

/**
 * Checks if HTML has footer
 */
function hasFooter(html: string): boolean {
  // Simplified implementation
  return html.includes("<footer") || html.includes('class="footer"');
}

/**
 * Checks if HTML has sidebar
 */
function hasSidebar(html: string): boolean {
  // Simplified implementation
  return html.includes("sidebar") || html.includes("side-bar");
}

/**
 * Calculates text to code ratio
 */
function calculateTextToCodeRatio(html: string): number {
  // Simplified implementation
  const text = extractTextFromHtml(html);
  return text.length / html.length;
}

/**
 * Identifies main content in HTML
 */
function identifyMainContent(html: string): string {
  // Simplified implementation
  const mainContentMatch =
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
    html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  return mainContentMatch ? mainContentMatch[1] : "";
}

/**
 * Identifies supporting content in HTML
 */
function identifySupportingContent(html: string): string {
  // Simplified implementation
  const asideMatch = html.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i);
  return asideMatch ? asideMatch[1] : "";
}

/**
 * Counts elements in structured data
 */
function countElements(structured: any): number {
  // Simplified implementation
  let count = 0;
  const countRecursive = (obj: any) => {
    if (Array.isArray(obj)) {
      count += obj.length;
      obj.forEach((item) => {
        if (typeof item === "object" && item !== null) {
          countRecursive(item);
        }
      });
    } else if (typeof obj === "object" && obj !== null) {
      count += Object.keys(obj).length;
      Object.values(obj).forEach((value) => {
        if (typeof value === "object" && value !== null) {
          countRecursive(value);
        }
      });
    }
  };
  countRecursive(structured);
  return count;
}

/**
 * Skips headers and footers from text
 */
function skipHeadersAndFooters(text: string): string {
  // Simplified implementation
  const lines = text.split("\n");
  if (lines.length <= 10) return text;

  // Skip first 2 and last 2 lines as potential header/footer
  return lines.slice(2, lines.length - 2).join("\n");
}

/**
 * Removes images and media from structured data
 */
function removeImagesAndMedia(structured: any): any {
  // Simplified implementation
  const result = { ...structured };
  delete result.images;

  if (result.content) {
    result.content = { ...result.content };
    delete result.content.images;
    delete result.content.videos;
    delete result.content.media;
  }

  return result;
}

/**
 * Auto-detects structure in HTML content using AI-powered analysis
 * Uses external AI services to categorize and structure content
 */
async function autoDetectStructure(
  html: string,
  text: string,
  categories: string[],
) {
  try {
    // Initialize the structured data object
    const structured: Record<string, any> = {};

    // Skip processing if text is too short
    if (!text || text.length < 50) {
      console.warn("Text content too short for AI analysis");
      return structured;
    }

    // Prepare the API request payload with more comprehensive options
    const payload = {
      content: text.substring(0, 15000), // Increased limit for better context
      html: html.substring(0, 20000), // Increased limit for better context
      categories: categories,
      options: {
        extractMetadata: true,
        confidenceThreshold: 0.7, // Increased confidence threshold for better accuracy
        maxItemsPerCategory: 15, // Increased max items for more comprehensive results
        extractRelationships: true, // Extract relationships between items
        deduplicateResults: true, // Deduplicate results
        enhancedCategorization: true, // Use enhanced categorization algorithms
        version: "2.0", // API version
      },
    };

    // Define the API endpoint for AI content analysis
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
    const AI_ANALYSIS_ENDPOINT = `${API_BASE_URL}/scraping/analyze`;

    // Call the AI service with improved timeout and retry handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout (increased)

    // Implement retry logic with exponential backoff
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < maxRetries) {
      try {
        // Add retry delay with exponential backoff (except for first attempt)
        if (retryCount > 0) {
          const backoffDelay = Math.min(
            1000 * Math.pow(2, retryCount - 1),
            8000,
          );
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          console.log(
            `Retrying AI analysis (attempt ${retryCount + 1}/${maxRetries})`,
          );
        }

        const response = await fetch(AI_ANALYSIS_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Retry-Count": retryCount.toString(), // Add retry count header for monitoring
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
          // Add cache control to prevent caching of analysis requests
          cache: "no-store",
        });

        // Handle different response status codes appropriately
        if (response.status === 429) {
          // Rate limiting
          const retryAfter = response.headers.get("Retry-After");
          const retryDelay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : 2000;
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          retryCount++;
          continue;
        }

        if (!response.ok) {
          // For 5xx errors, retry; for 4xx errors, fail immediately (except 429)
          if (response.status >= 500) {
            throw new Error(
              `AI analysis server error: ${response.status} ${response.statusText}`,
            );
          } else {
            // Client errors should not be retried
            throw new Error(
              `AI analysis client error: ${response.status} ${response.statusText}`,
            );
          }
        }

        const aiResult = await response.json();

        // Process the AI results with enhanced validation
        if (
          aiResult &&
          aiResult.categories &&
          typeof aiResult.categories === "object"
        ) {
          // Map the AI results to our structured format with validation
          for (const [category, data] of Object.entries(aiResult.categories)) {
            if (data && typeof data === "object") {
              structured[category.toLowerCase()] = data;
            }
          }

          // Add metadata from AI analysis if available with validation
          if (aiResult.metadata && typeof aiResult.metadata === "object") {
            structured.metadata = {
              ...aiResult.metadata,
              aiProcessed: true,
              processingTimestamp: new Date().toISOString(),
            };
          }

          // Add analysis quality metrics if available
          if (aiResult.quality) {
            structured.quality = aiResult.quality;
          }

          // Clear timeout since we got a successful response
          clearTimeout(timeoutId);

          // If we have results, return them
          if (Object.keys(structured).length > 0) {
            return structured;
          }
        }

        // If AI service returned empty or invalid results, log and continue to fallback
        console.warn(
          "AI service returned empty or invalid results, falling back to pattern matching",
        );
        break;
      } catch (fetchError: any) {
        lastError = fetchError;

        // Don't retry if it was a timeout or abort error
        if (
          fetchError.name === "AbortError" ||
          fetchError.name === "TimeoutError"
        ) {
          console.error("AI analysis timeout:", fetchError);
          break;
        }

        // Don't retry if it was a client error (except for rate limiting which is handled above)
        if (fetchError.message && fetchError.message.includes("client error")) {
          console.error("AI analysis client error:", fetchError);
          break;
        }

        // For other errors, retry
        retryCount++;

        // If we've exhausted all retries, break out of the loop
        if (retryCount >= maxRetries) {
          console.error(
            `AI analysis failed after ${maxRetries} retries:`,
            fetchError,
          );
          break;
        }
      }
    }

    // Always clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);

    // Log the fallback reason
    if (lastError) {
      console.warn(
        `Falling back to pattern extraction due to error: ${lastError.message}`,
      );
    }

    // Fall back to pattern-based extraction if AI service fails or returns no results
    return fallbackPatternExtraction(html, text, categories);
  } catch (error) {
    console.error("Error auto-detecting structure:", error);
    // Return an empty object with error information for debugging
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unknown error during structure detection",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Fallback pattern-based extraction when AI service is unavailable
 * Enhanced with more robust pattern matching and error handling
 */
function fallbackPatternExtraction(
  html: string,
  text: string,
  categories: string[],
) {
  try {
    const structured: Record<string, any> = {};
    const startTime = Date.now();
    const processedCategories: string[] = [];
    const warnings: string[] = [];

    // Add metadata to indicate this is fallback extraction
    structured.metadata = {
      source: "fallback_pattern_extraction",
      timestamp: new Date().toISOString(),
      categories: categories,
      confidence: 0.6, // Lower confidence for pattern-based extraction
    };

    // Process each requested category with enhanced error handling
    for (const category of categories) {
      try {
        const normalizedCategory =
          category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

        switch (normalizedCategory) {
          case "Services":
            const serviceItems = extractServiceItems(html, text);
            structured.services = {
              items:
                serviceItems.length > 0
                  ? serviceItems
                  : [
                      {
                        title: "Service Analysis",
                        description:
                          "No services automatically detected. Please check the content manually.",
                        confidence: 0.5,
                      },
                    ],
              description: "Services offered",
              extractionMethod: "pattern_matching",
              itemCount: serviceItems.length,
            };
            processedCategories.push("Services");
            break;

          case "Fees":
            const feeItems = extractFeeItems(html, text);
            structured.fees = {
              items:
                feeItems.length > 0
                  ? feeItems
                  : [
                      {
                        title: "Fee Analysis",
                        amount: "Varies",
                        description:
                          "No fee information automatically detected. Please check the content manually.",
                        confidence: 0.5,
                      },
                    ],
              description: "Fees and pricing information",
              extractionMethod: "pattern_matching",
              itemCount: feeItems.length,
            };
            processedCategories.push("Fees");
            break;

          case "Documents":
            const documentItems = extractDocumentItems(html);
            structured.documents = {
              items:
                documentItems.length > 0
                  ? documentItems
                  : [
                      {
                        title: "Document Analysis",
                        type: "Info",
                        description:
                          "No documents automatically detected. Please check the content manually.",
                        confidence: 0.5,
                      },
                    ],
              description: "Available documents and forms",
              extractionMethod: "pattern_matching",
              itemCount: documentItems.length,
            };
            processedCategories.push("Documents");
            break;

          case "Eligibility":
            const eligibilityItems = extractEligibilityItems(text);
            structured.eligibility = {
              items:
                eligibilityItems.length > 0
                  ? eligibilityItems
                  : [
                      {
                        title: "Eligibility Analysis",
                        description:
                          "No eligibility criteria automatically detected. Please check the content manually.",
                        confidence: 0.5,
                      },
                    ],
              description: "Eligibility requirements and criteria",
              extractionMethod: "pattern_matching",
              itemCount: eligibilityItems.length,
            };
            processedCategories.push("Eligibility");
            break;

          default:
            // Handle unknown categories with generic text analysis
            const genericItems = extractGenericItems(text, normalizedCategory);
            const categoryKey = normalizedCategory.toLowerCase();
            structured[categoryKey] = {
              items:
                genericItems.length > 0
                  ? genericItems
                  : [
                      {
                        title: `${normalizedCategory} Analysis`,
                        description: `No ${normalizedCategory.toLowerCase()} information automatically detected. Please check the content manually.`,
                        confidence: 0.4,
                      },
                    ],
              description: `${normalizedCategory} information`,
              extractionMethod: "generic_pattern_matching",
              itemCount: genericItems.length,
            };
            processedCategories.push(normalizedCategory);
            warnings.push(
              `Used generic extraction for category: ${normalizedCategory}`,
            );
            break;
        }
      } catch (categoryError) {
        console.error(`Error processing category ${category}:`, categoryError);
        warnings.push(
          `Failed to process category ${category}: ${categoryError instanceof Error ? categoryError.message : "Unknown error"}`,
        );

        // Add empty placeholder for failed category
        const categoryKey = category.toLowerCase();
        structured[categoryKey] = {
          items: [
            {
              title: `${category} Analysis Error`,
              description: `Error occurred while analyzing ${category.toLowerCase()} content.`,
              error:
                categoryError instanceof Error
                  ? categoryError.message
                  : "Unknown error",
              confidence: 0.1,
            },
          ],
          description: `${category} extraction error`,
          extractionMethod: "error_fallback",
          itemCount: 0,
          error: true,
        };
      }
    }

    // Update metadata with processing information
    structured.metadata = {
      ...structured.metadata,
      processedCategories,
      processingTime: Date.now() - startTime,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    return structured;
  } catch (error) {
    console.error("Critical error in fallback pattern extraction:", error);
    // Return minimal structured data with error information
    return {
      metadata: {
        source: "fallback_pattern_extraction",
        timestamp: new Date().toISOString(),
        error:
          error instanceof Error
            ? error.message
            : "Unknown error in pattern extraction",
        categories: categories,
      },
      error: {
        items: [
          {
            title: "Extraction Error",
            description: "Failed to extract content using pattern matching.",
            error: error instanceof Error ? error.message : "Unknown error",
            confidence: 0.1,
          },
        ],
        description: "Error during content extraction",
        extractionMethod: "error_fallback",
        itemCount: 0,
        error: true,
      },
    };
  }
}

/**
 * Extract generic items for categories not specifically handled
 */
function extractGenericItems(text: string, category: string) {
  const items = [];
  const categoryLower = category.toLowerCase();
  const sentences = text.split(/[.!?]\s+/);

  // Look for sentences containing the category name or related terms
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(categoryLower)) {
      items.push({
        title: sentence.substring(0, 50) + (sentence.length > 50 ? "..." : ""),
        description: sentence.trim(),
        confidence: 0.5,
        category: category,
      });

      // Limit to 5 items
      if (items.length >= 5) break;
    }
  }

  return items;
}

/**
 * Extract service items using pattern matching
 */
function extractServiceItems(html: string, text: string) {
  const items = [];

  // Look for service-like sections in the HTML
  const serviceRegex =
    /<h\d[^>]*>([^<]+(?:service|offering|solution)[^<]*)<\/h\d>|<div[^>]*class="[^"]*service[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;

  while ((match = serviceRegex.exec(html)) !== null) {
    const title = match[1] || "Service";
    const content = match[2] || "";
    const description = content
      ? extractTextFromHtml(content).substring(0, 200)
      : "";

    items.push({
      title: title.trim(),
      description: description.trim() || "No description available",
    });
  }

  // If no services found via HTML structure, try text-based extraction
  if (items.length === 0) {
    // Look for sentences that might describe services
    const sentences = text.split(/[.!?]\s+/);
    for (const sentence of sentences) {
      if (
        /\b(offer|provide|service|solution)s?\b/i.test(sentence) &&
        sentence.length > 30
      ) {
        items.push({
          title:
            sentence.substring(0, 50).trim() +
            (sentence.length > 50 ? "..." : ""),
          description: sentence.trim(),
        });

        // Limit to 5 items when using this fallback approach
        if (items.length >= 5) break;
      }
    }
  }

  return items;
}

/**
 * Extract fee items using pattern matching
 */
function extractFeeItems(html: string, text: string) {
  const items = [];

  // Look for price/fee patterns in the text
  const priceRegex = /\$\s?\d+(?:\.\d{2})?|\d+(?:\.\d{2})\s?(?:USD|dollars)/g;
  const prices = text.match(priceRegex) || [];

  // Look for fee tables in the HTML
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[0];
    if (/price|cost|fee|payment/i.test(tableHtml)) {
      // Extract rows from the table
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;

      while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const rowContent = rowMatch[1];
        const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        const cells = [];
        let cellMatch;

        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
          cells.push(extractTextFromHtml(cellMatch[1]).trim());
        }

        if (cells.length >= 2) {
          // Assume first cell is description and look for price in other cells
          const title = cells[0];
          let amount = "";

          // Find the cell that looks most like a price
          for (let i = 1; i < cells.length; i++) {
            if (/\$\s?\d+|\d+\s?(?:USD|dollars)/i.test(cells[i])) {
              amount = cells[i];
              break;
            }
          }

          if (title && amount) {
            items.push({
              title,
              amount,
              description: `${title}: ${amount}`,
            });
          }
        }
      }
    }
  }

  // If no structured fees found, use the extracted prices
  if (items.length === 0 && prices.length > 0) {
    // Look for sentences containing prices
    const sentences = text.split(/[.!?]\s+/);
    for (const price of prices) {
      for (const sentence of sentences) {
        if (sentence.includes(price)) {
          items.push({
            title: `Fee: ${price}`,
            amount: price,
            description: sentence.trim(),
          });
          break;
        }
      }

      // Limit to 5 items when using this fallback approach
      if (items.length >= 5) break;
    }
  }

  return items;
}

/**
 * Extract document items using pattern matching
 */
function extractDocumentItems(html: string) {
  const items = [];

  // Look for links to documents
  const linkRegex =
    /<a[^>]*href=["']([^"']+\.(?:pdf|doc|docx|xls|xlsx|ppt|pptx|txt))["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const linkText = extractTextFromHtml(match[2]).trim();
    const extension = url.split(".").pop()?.toLowerCase() || "";

    items.push({
      title: linkText || `Document (${extension.toUpperCase()})`,
      type: extension.toUpperCase(),
      url: url,
      description: `${linkText || "Document"} (${extension.toUpperCase()} format)`,
    });
  }

  return items;
}

/**
 * Extract eligibility items using pattern matching
 */
function extractEligibilityItems(text: string) {
  const items = [];

  // Look for eligibility-related sentences
  const eligibilityKeywords = [
    "eligible",
    "eligibility",
    "qualify",
    "qualification",
    "requirement",
    "criteria",
    "must be",
    "must have",
    "you need",
    "applicants must",
    "to be eligible",
  ];

  const sentences = text.split(/[.!?]\s+/);

  for (const sentence of sentences) {
    for (const keyword of eligibilityKeywords) {
      if (sentence.toLowerCase().includes(keyword)) {
        items.push({
          title: `Eligibility: ${keyword}`,
          description: sentence.trim(),
        });
        break;
      }
    }

    // Limit to 5 items
    if (items.length >= 5) break;
  }

  return items;
}
