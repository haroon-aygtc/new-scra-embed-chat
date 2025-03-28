import { NextRequest, NextResponse } from "next/server";

/**
 * API route handler for AI-powered content analysis
 * This endpoint analyzes content and categorizes it using AI techniques
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body with error handling
    let analysisRequest;
    try {
      analysisRequest = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    // Validate the request
    if (!analysisRequest.content) {
      return NextResponse.json(
        { error: "Content is required for analysis" },
        { status: 400 },
      );
    }

    // Extract parameters
    const { content, html, categories, options } = analysisRequest;

    // Set default options if not provided
    const analysisOptions = {
      extractMetadata: options?.extractMetadata ?? true,
      confidenceThreshold: options?.confidenceThreshold ?? 0.6,
      maxItemsPerCategory: options?.maxItemsPerCategory ?? 10,
    };

    // Perform AI-powered content analysis
    // In a production environment, this would call an external AI service
    // For now, we'll implement a pattern-based analysis as a placeholder
    const analysisResult = await analyzeContent(
      content,
      html,
      categories,
      analysisOptions,
    );

    // Set appropriate cache headers
    const headers = new Headers();
    headers.set("Cache-Control", "no-store, max-age=0");

    // Set CORS headers for cross-origin requests
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Return the analysis result
    return NextResponse.json(analysisResult, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Content analysis API error:", error);

    // Set CORS headers for cross-origin requests
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return NextResponse.json(
      {
        error: error.message || "Failed to analyze content",
        suggestions: [
          "Check your request format and try again",
          "Ensure the content is not empty",
          "Try with a smaller content size if the request is too large",
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
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return new NextResponse(null, { status: 204, headers });
}

/**
 * Analyze content using pattern-based techniques
 * In a production environment, this would be replaced with calls to AI services
 */
async function analyzeContent(
  content: string,
  html: string,
  categories: string[],
  options: any,
) {
  // Initialize result structure
  const result = {
    categories: {} as Record<string, any>,
    metadata: {
      confidence: 0.85,
      processingTime: 0,
      modelVersion: "1.0.0",
      analysisTimestamp: new Date().toISOString(),
    },
  };

  const startTime = Date.now();

  // Process each requested category
  for (const category of categories) {
    switch (category.toLowerCase()) {
      case "services":
        result.categories["Services"] = await analyzeServices(
          content,
          html,
          options,
        );
        break;
      case "fees":
        result.categories["Fees"] = await analyzeFees(content, html, options);
        break;
      case "documents":
        result.categories["Documents"] = await analyzeDocuments(
          content,
          html,
          options,
        );
        break;
      case "eligibility":
        result.categories["Eligibility"] = await analyzeEligibility(
          content,
          html,
          options,
        );
        break;
      default:
        // For unknown categories, try generic analysis
        result.categories[category] = await analyzeGeneric(
          content,
          category,
          options,
        );
        break;
    }
  }

  // Calculate processing time
  result.metadata.processingTime = Date.now() - startTime;

  return result;
}

/**
 * Analyze content for services
 */
async function analyzeServices(content: string, html: string, options: any) {
  // In a production environment, this would use AI to extract services
  // For now, we'll use pattern matching

  const items = [];
  const serviceKeywords = [
    "service",
    "offering",
    "solution",
    "package",
    "plan",
  ];

  // Extract sentences that might contain service information
  const sentences = content.split(/[.!?]\s+/);

  for (const sentence of sentences) {
    // Check if the sentence contains service-related keywords
    if (
      serviceKeywords.some((keyword) =>
        sentence.toLowerCase().includes(keyword),
      )
    ) {
      // Extract a potential service name and description
      const words = sentence.split(/\s+/);
      let serviceTitle = "";

      // Try to extract a meaningful title
      for (let i = 0; i < words.length - 1; i++) {
        if (
          serviceKeywords.some((keyword) =>
            words[i].toLowerCase().includes(keyword),
          )
        ) {
          // Take a few words before and after the keyword as the title
          const start = Math.max(0, i - 2);
          const end = Math.min(words.length, i + 3);
          serviceTitle = words.slice(start, end).join(" ");
          break;
        }
      }

      if (!serviceTitle) {
        serviceTitle =
          sentence.substring(0, 50) + (sentence.length > 50 ? "..." : "");
      }

      items.push({
        title: serviceTitle.trim(),
        description: sentence.trim(),
        confidence: 0.75,
      });

      // Limit the number of items
      if (items.length >= options.maxItemsPerCategory) {
        break;
      }
    }
  }

  return {
    items,
    description: "Services offered based on content analysis",
  };
}

/**
 * Analyze content for fees
 */
async function analyzeFees(content: string, html: string, options: any) {
  // In a production environment, this would use AI to extract fee information
  // For now, we'll use pattern matching

  const items = [];

  // Look for price patterns
  const priceRegex = /\$\s?\d+(?:\.\d{2})?|\d+(?:\.\d{2})\s?(?:USD|dollars)/g;
  const prices = content.match(priceRegex) || [];

  // Extract sentences containing prices
  const sentences = content.split(/[.!?]\s+/);

  for (const price of prices) {
    for (const sentence of sentences) {
      if (sentence.includes(price)) {
        // Try to extract a meaningful title
        let title = "Fee";

        // Look for fee-related keywords
        const feeKeywords = ["fee", "cost", "price", "rate", "charge"];
        for (const keyword of feeKeywords) {
          if (sentence.toLowerCase().includes(keyword)) {
            const keywordIndex = sentence.toLowerCase().indexOf(keyword);
            const start = Math.max(0, keywordIndex - 20);
            const end = Math.min(sentence.length, keywordIndex + 30);
            title = sentence.substring(start, end).trim();
            break;
          }
        }

        items.push({
          title: title,
          amount: price,
          description: sentence.trim(),
          confidence: 0.8,
        });

        break;
      }
    }

    // Limit the number of items
    if (items.length >= options.maxItemsPerCategory) {
      break;
    }
  }

  return {
    items,
    description: "Fees and pricing information based on content analysis",
  };
}

/**
 * Analyze content for documents
 */
async function analyzeDocuments(content: string, html: string, options: any) {
  // In a production environment, this would use AI to extract document information
  // For now, we'll use pattern matching

  const items = [];

  // Look for document-related keywords
  const documentKeywords = [
    "form",
    "document",
    "application",
    "pdf",
    "download",
  ];

  // Extract sentences that might contain document information
  const sentences = content.split(/[.!?]\s+/);

  for (const sentence of sentences) {
    // Check if the sentence contains document-related keywords
    if (
      documentKeywords.some((keyword) =>
        sentence.toLowerCase().includes(keyword),
      )
    ) {
      // Try to determine document type
      let documentType = "Document";

      if (sentence.toLowerCase().includes("pdf")) {
        documentType = "PDF";
      } else if (sentence.toLowerCase().includes("form")) {
        documentType = "Form";
      } else if (sentence.toLowerCase().includes("application")) {
        documentType = "Application";
      }

      // Extract a potential document title
      let title =
        sentence.substring(0, 50) + (sentence.length > 50 ? "..." : "");

      items.push({
        title: title.trim(),
        type: documentType,
        description: sentence.trim(),
        confidence: 0.7,
      });

      // Limit the number of items
      if (items.length >= options.maxItemsPerCategory) {
        break;
      }
    }
  }

  return {
    items,
    description: "Documents and forms based on content analysis",
  };
}

/**
 * Analyze content for eligibility criteria
 */
async function analyzeEligibility(content: string, html: string, options: any) {
  // In a production environment, this would use AI to extract eligibility information
  // For now, we'll use pattern matching

  const items = [];

  // Look for eligibility-related keywords
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

  // Extract sentences that might contain eligibility information
  const sentences = content.split(/[.!?]\s+/);

  for (const sentence of sentences) {
    // Check if the sentence contains eligibility-related keywords
    for (const keyword of eligibilityKeywords) {
      if (sentence.toLowerCase().includes(keyword)) {
        items.push({
          title: `Eligibility: ${keyword}`,
          description: sentence.trim(),
          confidence: 0.75,
        });
        break;
      }
    }

    // Limit the number of items
    if (items.length >= options.maxItemsPerCategory) {
      break;
    }
  }

  return {
    items,
    description:
      "Eligibility requirements and criteria based on content analysis",
  };
}

/**
 * Generic analysis for other categories
 */
async function analyzeGeneric(content: string, category: string, options: any) {
  // In a production environment, this would use AI to extract information for the category
  // For now, we'll use a simple approach

  const items = [];

  // Extract sentences that might be relevant to the category
  const sentences = content.split(/[.!?]\s+/);

  // Look for sentences containing the category name
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(category.toLowerCase())) {
      items.push({
        title: sentence.substring(0, 50) + (sentence.length > 50 ? "..." : ""),
        description: sentence.trim(),
        confidence: 0.6,
      });

      // Limit the number of items
      if (items.length >= options.maxItemsPerCategory) {
        break;
      }
    }
  }

  return {
    items,
    description: `${category} information based on content analysis`,
  };
}
