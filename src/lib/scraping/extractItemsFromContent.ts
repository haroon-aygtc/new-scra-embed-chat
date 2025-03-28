import { CategoryItem } from "@/types/scraping";
import { generateUniqueId } from "@/lib/utils/ids";

/**
 * Extracts items from content based on category
 */
export async function extractItemsFromContent(
  extractedData: any,
  category: string,
): Promise<CategoryItem[]> {
  const items: CategoryItem[] = [];
  const categoryKey = category.toLowerCase();
  const content = extractedData.text || extractedData.html || "";

  // Get keywords for this category
  const keywords = getCategoryKeywords(categoryKey);

  // Extract potential items based on patterns and keywords
  const potentialItems = extractPotentialItems(content, categoryKey, keywords);

  // Convert potential items to CategoryItem format
  potentialItems.forEach((item, index) => {
    items.push({
      id: generateUniqueId(),
      title: item.title || `${category} ${index + 1}`,
      content: item.content || "",
      confidence: calculateConfidence(item, keywords),
      verified: false,
      source: extractedData.url || "",
      metadata: {
        extractionMethod: "content-based",
        timestamp: new Date().toISOString(),
        keywords: item.matchedKeywords || [],
        position: item.position || 0,
      },
    });
  });

  return items;
}

/**
 * Returns keywords for a category
 */
export function getCategoryKeywords(category: string): string[] {
  const keywords: Record<string, string[]> = {
    services: [
      "service",
      "offering",
      "solution",
      "product",
      "package",
      "plan",
      "feature",
    ],
    fees: [
      "fee",
      "price",
      "cost",
      "pricing",
      "payment",
      "rate",
      "charge",
      "$",
      "dollar",
      "subscription",
    ],
    documents: [
      "document",
      "form",
      "file",
      "paperwork",
      "agreement",
      "contract",
      "pdf",
      "download",
      "upload",
    ],
    eligibility: [
      "eligibility",
      "requirement",
      "qualify",
      "criteria",
      "eligible",
      "qualification",
      "who can",
      "must be",
    ],
    products: [
      "product",
      "item",
      "merchandise",
      "goods",
      "inventory",
      "stock",
      "catalog",
    ],
    contact: [
      "contact",
      "email",
      "phone",
      "call",
      "address",
      "location",
      "reach",
      "support",
    ],
    faq: [
      "faq",
      "question",
      "answer",
      "frequently",
      "asked",
      "help",
      "support",
    ],
    hours: [
      "hours",
      "schedule",
      "open",
      "close",
      "availability",
      "time",
      "day",
      "week",
    ],
    locations: [
      "location",
      "address",
      "branch",
      "office",
      "store",
      "find us",
      "visit",
      "map",
    ],
    team: [
      "team",
      "staff",
      "employee",
      "member",
      "personnel",
      "expert",
      "specialist",
      "professional",
    ],
    testimonials: [
      "testimonial",
      "review",
      "feedback",
      "client",
      "customer",
      "rating",
      "experience",
    ],
  };

  const key = category.toLowerCase();
  return keywords[key] || [key];
}

/**
 * Extract potential items from content based on patterns and keywords
 */
function extractPotentialItems(
  content: string,
  category: string,
  keywords: string[],
): any[] {
  const potentialItems: any[] = [];

  // Different extraction strategies based on category
  switch (category) {
    case "services":
      extractServiceItems(content, keywords, potentialItems);
      break;
    case "fees":
      extractFeeItems(content, keywords, potentialItems);
      break;
    case "documents":
      extractDocumentItems(content, keywords, potentialItems);
      break;
    case "eligibility":
      extractEligibilityItems(content, keywords, potentialItems);
      break;
    case "products":
      extractProductItems(content, keywords, potentialItems);
      break;
    default:
      // Generic extraction for other categories
      extractGenericItems(content, keywords, potentialItems);
  }

  return potentialItems;
}

/**
 * Extract service items from content
 */
function extractServiceItems(
  content: string,
  keywords: string[],
  items: any[],
) {
  // Look for headings followed by descriptions
  const headingPattern = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
  let match;

  while ((match = headingPattern.exec(content)) !== null) {
    const title = match[1].trim();
    const position = match.index;

    // Check if the heading contains any service keywords
    const matchedKeywords = keywords.filter((keyword) =>
      title.toLowerCase().includes(keyword.toLowerCase()),
    );

    if (matchedKeywords.length > 0 || /service|plan|package/i.test(title)) {
      // Try to find a description after the heading
      const afterHeading = content.substring(
        position + match[0].length,
        position + match[0].length + 500,
      );
      const descriptionMatch = /<p[^>]*>([^<]+)<\/p>/i.exec(afterHeading);

      items.push({
        title,
        content: descriptionMatch ? descriptionMatch[1].trim() : "",
        matchedKeywords,
        position,
      });
    }
  }

  // Also look for list items that might be services
  const listItemPattern = /<li[^>]*>([^<]+)<\/li>/gi;

  while ((match = listItemPattern.exec(content)) !== null) {
    const itemText = match[1].trim();
    const position = match.index;

    // Check if the list item contains any service keywords
    const matchedKeywords = keywords.filter((keyword) =>
      itemText.toLowerCase().includes(keyword.toLowerCase()),
    );

    if (matchedKeywords.length > 0 || /service|plan|package/i.test(itemText)) {
      // Split into title and content if possible
      const parts = itemText.split(/:|–|\-/); // Split by colon, en dash, or hyphen

      if (parts.length > 1) {
        items.push({
          title: parts[0].trim(),
          content: parts.slice(1).join(" ").trim(),
          matchedKeywords,
          position,
        });
      } else {
        items.push({
          title: itemText,
          content: "",
          matchedKeywords,
          position,
        });
      }
    }
  }
}

/**
 * Extract fee items from content
 */
function extractFeeItems(content: string, keywords: string[], items: any[]) {
  // Look for price patterns
  const pricePattern =
    /\$\s*\d+(?:\.\d{2})?(?:\s*[-–]\s*\$\s*\d+(?:\.\d{2})?)?|\d+(?:\.\d{2})?\s*(?:dollars|USD)/gi;
  let match;

  // First pass: find explicit fee sections
  const feeHeadingPattern =
    /<h[1-6][^>]*>([^<]*(?:fee|price|cost|pricing)[^<]*)<\/h[1-6]>/gi;

  while ((match = feeHeadingPattern.exec(content)) !== null) {
    const title = match[1].trim();
    const position = match.index;

    // Get the content after the heading
    const afterHeading = content.substring(
      position + match[0].length,
      position + match[0].length + 1000,
    );

    // Look for prices in this section
    const priceMatches = [...afterHeading.matchAll(pricePattern)];

    priceMatches.forEach((priceMatch, index) => {
      const priceText = priceMatch[0];
      const surroundingText = afterHeading.substring(
        Math.max(0, priceMatch.index! - 50),
        Math.min(
          afterHeading.length,
          priceMatch.index! + priceText.length + 50,
        ),
      );

      items.push({
        title: `${title} ${index + 1}`,
        content: surroundingText.trim(),
        price: priceText,
        matchedKeywords: ["fee", "price"],
        position: position + priceMatch.index!,
      });
    });
  }

  // Second pass: find prices throughout the content
  while ((match = pricePattern.exec(content)) !== null) {
    const price = match[0];
    const position = match.index;

    // Get surrounding text for context
    const start = Math.max(0, position - 100);
    const end = Math.min(content.length, position + price.length + 100);
    const surroundingText = content.substring(start, end);

    // Try to extract a title from the surrounding text
    let title = "";
    const titleMatch = surroundingText.match(
      /(?:<[^>]+>)?([^<:\n]+)(?:<\/[^>]+>)?\s*(?::|is|costs?|priced at)/i,
    );

    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      // If no clear title, use keywords to create one
      const matchedKeywords = keywords.filter((keyword) =>
        surroundingText.toLowerCase().includes(keyword.toLowerCase()),
      );

      title =
        matchedKeywords.length > 0
          ? `${matchedKeywords[0].charAt(0).toUpperCase() + matchedKeywords[0].slice(1)} Fee`
          : "Fee";
    }

    // Check if this price is already included in a previous item
    const isDuplicate = items.some(
      (item) =>
        item.price === price && Math.abs(item.position - position) < 200,
    );

    if (!isDuplicate) {
      items.push({
        title,
        content: surroundingText.trim(),
        price,
        matchedKeywords: ["fee", "price"],
        position,
      });
    }
  }
}

/**
 * Extract document items from content
 */
function extractDocumentItems(
  content: string,
  keywords: string[],
  items: any[],
) {
  // Look for document links
  const documentLinkPattern =
    /<a[^>]*href=["']([^"']+\.(?:pdf|doc|docx|txt|rtf|xls|xlsx|csv))["'][^>]*>([^<]+)<\/a>/gi;
  let match;

  while ((match = documentLinkPattern.exec(content)) !== null) {
    const url = match[1];
    const title = match[2].trim();
    const position = match.index;

    items.push({
      title,
      content: `Document available for download: ${url}`,
      url,
      documentType: url.split(".").pop(),
      matchedKeywords: ["document", "download"],
      position,
    });
  }

  // Look for document mentions
  const documentMentionPattern =
    /(?:required|necessary|needed)\s+(?:documents?|forms?|paperwork|files?)\s*(?:include|:)\s*([^<.]+)/gi;

  while ((match = documentMentionPattern.exec(content)) !== null) {
    const documentList = match[1].trim();
    const position = match.index;

    // Split the list if it contains commas or 'and'
    const documents = documentList.split(/,|\sand\s|\s&\s/);

    documents.forEach((doc, index) => {
      const docName = doc.trim();
      if (docName) {
        items.push({
          title: docName,
          content: `Required document mentioned in content`,
          matchedKeywords: ["document", "required"],
          position: position + index,
        });
      }
    });
  }

  // Look for document sections
  const documentSectionPattern =
    /<h[1-6][^>]*>([^<]*(?:document|form|paperwork)[^<]*)<\/h[1-6]>/gi;

  while ((match = documentSectionPattern.exec(content)) !== null) {
    const title = match[1].trim();
    const position = match.index;

    // Get the content after the heading
    const afterHeading = content.substring(
      position + match[0].length,
      position + match[0].length + 500,
    );

    // Look for list items in this section
    const listItemPattern = /<li[^>]*>([^<]+)<\/li>/gi;
    let listMatch;
    let foundItems = false;

    while ((listMatch = listItemPattern.exec(afterHeading)) !== null) {
      foundItems = true;
      const itemText = listMatch[1].trim();

      items.push({
        title: itemText,
        content: `Document listed under ${title}`,
        matchedKeywords: ["document"],
        position: position + listMatch.index,
      });
    }

    // If no list items found, use the paragraph after the heading
    if (!foundItems) {
      const paragraphMatch = /<p[^>]*>([^<]+)<\/p>/i.exec(afterHeading);

      if (paragraphMatch) {
        items.push({
          title,
          content: paragraphMatch[1].trim(),
          matchedKeywords: ["document"],
          position,
        });
      }
    }
  }
}

/**
 * Extract eligibility items from content
 */
function extractEligibilityItems(
  content: string,
  keywords: string[],
  items: any[],
) {
  // Look for eligibility sections
  const eligibilityPattern =
    /<h[1-6][^>]*>([^<]*(?:eligibility|requirements?|who can|qualif)[^<]*)<\/h[1-6]>/gi;
  let match;

  while ((match = eligibilityPattern.exec(content)) !== null) {
    const title = match[1].trim();
    const position = match.index;

    // Get the content after the heading
    const afterHeading = content.substring(
      position + match[0].length,
      position + match[0].length + 1000,
    );

    // Look for list items in this section
    const listItemPattern = /<li[^>]*>([^<]+)<\/li>/gi;
    let listMatch;
    let foundItems = false;

    while ((listMatch = listItemPattern.exec(afterHeading)) !== null) {
      foundItems = true;
      const itemText = listMatch[1].trim();

      items.push({
        title: `Eligibility Requirement`,
        content: itemText,
        matchedKeywords: ["eligibility", "requirement"],
        position: position + listMatch.index,
      });
    }

    // If no list items found, use the paragraph after the heading
    if (!foundItems) {
      const paragraphMatch = /<p[^>]*>([^<]+)<\/p>/i.exec(afterHeading);

      if (paragraphMatch) {
        items.push({
          title,
          content: paragraphMatch[1].trim(),
          matchedKeywords: ["eligibility"],
          position,
        });
      }
    }
  }

  // Look for eligibility phrases
  const eligibilityPhrasePatterns = [
    /(?:must|should|need to)\s+be\s+([^.,<]+)/gi,
    /(?:only|available)\s+(?:for|to)\s+([^.,<]+)/gi,
    /(?:if you are|for those who are)\s+([^.,<]+)/gi,
  ];

  eligibilityPhrasePatterns.forEach((pattern) => {
    while ((match = pattern.exec(content)) !== null) {
      const requirement = match[1].trim();
      const position = match.index;

      // Get surrounding text for context
      const start = Math.max(0, position - 50);
      const end = Math.min(content.length, position + match[0].length + 50);
      const surroundingText = content.substring(start, end);

      items.push({
        title: "Eligibility Requirement",
        content: surroundingText,
        requirement,
        matchedKeywords: ["eligibility", "requirement"],
        position,
      });
    }
  });
}

/**
 * Extract product items from content with dynamic description extraction
 */
async function extractProductItems(
  content: string,
  keywords: string[],
  items: any[],
) {
  // Similar to service extraction but focused on products
  const productHeadingPattern =
    /<h[1-6][^>]*>([^<]*(?:product|item|merchandise)[^<]*)<\/h[1-6]>/gi;
  let match;

  while ((match = productHeadingPattern.exec(content)) !== null) {
    const title = match[1].trim();
    const position = match.index;

    // Get the content after the heading
    const afterHeading = content.substring(
      position + match[0].length,
      position + match[0].length + 1000, // Increased context window for better extraction
    );

    // Extract description using multiple patterns for better coverage
    let description = "";
    const descriptionPatterns = [
      /<p[^>]*>([^<]+)<\/p>/i,
      /<div[^>]*class=["'][^"']*(?:description|content|text)[^"']*["'][^>]*>([^<]+)<\/div>/i,
      /<span[^>]*class=["'][^"']*(?:description|content|text)[^"']*["'][^>]*>([^<]+)<\/span>/i,
    ];

    // Try each pattern until we find a match
    for (const pattern of descriptionPatterns) {
      const descriptionMatch = pattern.exec(afterHeading);
      if (descriptionMatch && descriptionMatch[1]) {
        description = descriptionMatch[1].trim();
        break;
      }
    }

    // If no description found, try to extract from multiple paragraphs
    if (!description) {
      const paragraphs = [];
      const paragraphPattern = /<p[^>]*>([^<]+)<\/p>/gi;
      let paragraphMatch;
      while (
        (paragraphMatch = paragraphPattern.exec(afterHeading)) !== null &&
        paragraphs.length < 3
      ) {
        paragraphs.push(paragraphMatch[1].trim());
      }
      if (paragraphs.length > 0) {
        description = paragraphs.join(" ");
      }
    }

    // Look for price in the description and surrounding content
    let price = null;
    const pricePatterns = [
      /\$\s*\d+(?:\.\d{2})?/i,
      /(?:price|cost|fee)\s*:\s*\$?\s*\d+(?:\.\d{2})?/i,
      /\d+(?:\.\d{2})?\s*(?:dollars|USD)/i,
    ];

    for (const pattern of pricePatterns) {
      const priceMatch = afterHeading.match(pattern);
      if (priceMatch) {
        price = priceMatch[0];
        break;
      }
    }

    // Try to extract additional metadata
    const metadata: Record<string, any> = {};

    // Extract availability
    const availabilityMatch = afterHeading.match(
      /(?:availability|status|stock)\s*:\s*([\w\s-]+)/i,
    );
    if (availabilityMatch) {
      metadata.availability = availabilityMatch[1].trim();
    }

    // Extract SKU/ID
    const skuMatch = afterHeading.match(
      /(?:sku|id|item[\s-]?(?:number|#|code))\s*:\s*([\w\d-]+)/i,
    );
    if (skuMatch) {
      metadata.sku = skuMatch[1].trim();
    }

    items.push({
      title,
      content: description || "",
      price,
      matchedKeywords: keywords.filter((keyword) =>
        title.toLowerCase().includes(keyword.toLowerCase()),
      ),
      position,
      metadata,
    });
  }

  // Look for product listings in structured formats (like grids or tables)
  const productItemPattern =
    /<div[^>]*class=["'][^"']*(?:product|item|card)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;

  while ((match = productItemPattern.exec(content)) !== null) {
    const productHtml = match[0];
    const position = match.index;

    // Extract title with expanded patterns
    const titlePatterns = [
      /<h\d[^>]*>([^<]+)<\/h\d>/i,
      /<div[^>]*class=["'][^"']*(?:title|name|heading)[^"']*["'][^>]*>([^<]+)<\/div>/i,
      /<span[^>]*class=["'][^"']*(?:title|name|heading)[^"']*["'][^>]*>([^<]+)<\/span>/i,
      /<a[^>]*>([^<]+)<\/a>/i,
    ];

    let title = "Product";
    for (const pattern of titlePatterns) {
      const titleMatch = pattern.exec(productHtml);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
        break;
      }
    }

    // Extract price with expanded patterns
    let price = null;
    const pricePatterns = [
      /\$\s*\d+(?:\.\d{2})?/i,
      /(?:price|cost|fee)\s*:\s*\$?\s*\d+(?:\.\d{2})?/i,
      /<span[^>]*class=["'][^"']*(?:price|cost)[^"']*["'][^>]*>([^<]+)<\/span>/i,
    ];

    for (const pattern of pricePatterns) {
      const priceMatch = productHtml.match(pattern);
      if (priceMatch) {
        price = priceMatch[0].replace(/<[^>]+>/g, "").trim();
        if (price.match(/price|cost|fee/i)) {
          price = price.replace(/.*?([\$\d\.]+).*/, "$1");
        }
        break;
      }
    }

    // Extract description with expanded patterns
    const descriptionPatterns = [
      /<p[^>]*>([^<]+)<\/p>/i,
      /<div[^>]*class=["'][^"']*(?:description|content|text)[^"']*["'][^>]*>([^<]+)<\/div>/i,
      /<span[^>]*class=["'][^"']*(?:description|content|text)[^"']*["'][^>]*>([^<]+)<\/span>/i,
    ];

    let description = "";
    for (const pattern of descriptionPatterns) {
      const descriptionMatch = pattern.exec(productHtml);
      if (descriptionMatch && descriptionMatch[1]) {
        description = descriptionMatch[1].trim();
        break;
      }
    }

    // Extract additional metadata
    const metadata: Record<string, any> = {};

    // Extract availability
    const availabilityPattern =
      /<[^>]*class=["'][^"']*(?:availability|stock)[^"']*["'][^>]*>([^<]+)<\/[^>]*>/i;
    const availabilityMatch = availabilityPattern.exec(productHtml);
    if (availabilityMatch) {
      metadata.availability = availabilityMatch[1].trim();
    }

    // Extract image URL if present
    const imageMatch = /<img[^>]*src=["']([^"']+)["'][^>]*>/i.exec(productHtml);
    if (imageMatch) {
      metadata.imageUrl = imageMatch[1];
    }

    items.push({
      title,
      content: description,
      price,
      matchedKeywords: ["product"],
      position,
      metadata,
    });
  }
}

/**
 * Extract generic items from content based on keywords
 */
function extractGenericItems(
  content: string,
  keywords: string[],
  items: any[],
) {
  // Look for sections with headings containing keywords
  const headingPattern = new RegExp(
    `<h[1-6][^>]*>([^<]*(?:${keywords.join("|")})[^<]*)<\/h[1-6]>`,
    "gi",
  );
  let match;

  while ((match = headingPattern.exec(content)) !== null) {
    const title = match[1].trim();
    const position = match.index;

    // Get the content after the heading
    const afterHeading = content.substring(
      position + match[0].length,
      position + match[0].length + 500,
    );
    const paragraphMatch = /<p[^>]*>([^<]+)<\/p>/i.exec(afterHeading);

    const matchedKeywords = keywords.filter((keyword) =>
      title.toLowerCase().includes(keyword.toLowerCase()),
    );

    items.push({
      title,
      content: paragraphMatch ? paragraphMatch[1].trim() : "",
      matchedKeywords,
      position,
    });
  }

  // Look for paragraphs containing multiple keywords
  const paragraphPattern = /<p[^>]*>([^<]+)<\/p>/gi;

  while ((match = paragraphPattern.exec(content)) !== null) {
    const paragraph = match[1].trim();
    const position = match.index;

    const matchedKeywords = keywords.filter((keyword) =>
      paragraph.toLowerCase().includes(keyword.toLowerCase()),
    );

    // Only include if multiple keywords match or a keyword appears multiple times
    if (
      matchedKeywords.length >= 2 ||
      (matchedKeywords.length === 1 &&
        (
          paragraph
            .toLowerCase()
            .match(new RegExp(matchedKeywords[0].toLowerCase(), "g")) || []
        ).length > 1)
    ) {
      // Try to extract a title from the first sentence
      const firstSentence = paragraph.split(/\.\s+/)[0];
      const title =
        firstSentence.length < 50
          ? firstSentence
          : matchedKeywords[0].charAt(0).toUpperCase() +
            matchedKeywords[0].slice(1);

      items.push({
        title,
        content: paragraph,
        matchedKeywords,
        position,
      });
    }
  }
}

/**
 * Calculate confidence score for an extracted item
 */
function calculateConfidence(item: any, keywords: string[]): number {
  let score = 0.5; // Base score

  // Increase score based on matched keywords
  if (item.matchedKeywords && item.matchedKeywords.length > 0) {
    score += Math.min(0.3, item.matchedKeywords.length * 0.1);
  }

  // Increase score if title contains keywords
  if (item.title) {
    const titleKeywordMatches = keywords.filter((keyword) =>
      item.title.toLowerCase().includes(keyword.toLowerCase()),
    ).length;

    score += Math.min(0.2, titleKeywordMatches * 0.05);
  }

  // Increase score if content is substantial
  if (item.content && item.content.length > 50) {
    score += 0.1;
  }

  // Increase score for specific category indicators
  if (item.price) score += 0.2; // Price is a strong indicator for fees/products
  if (item.url && /\.pdf$/i.test(item.url)) score += 0.2; // PDF URL is a strong indicator for documents

  return Math.min(0.95, score); // Cap at 0.95 as we can't be 100% confident
}

/**
 * Helper function to convert JSON to CSV
 */
export function convertToCSV(jsonData: any): string {
  if (typeof jsonData === "string") {
    try {
      jsonData = JSON.parse(jsonData);
    } catch (e) {
      return jsonData; // Return as-is if not valid JSON
    }
  }

  // Handle different data structures
  if (Array.isArray(jsonData)) {
    // Array of objects
    if (jsonData.length === 0) return "";

    const headers = Object.keys(jsonData[0]);
    const csvRows = [
      headers.join(","), // Header row
      ...jsonData.map((row) => {
        return headers
          .map((header) => {
            const cell = row[header];
            // Handle nested objects and arrays
            const cellStr =
              typeof cell === "object" ? JSON.stringify(cell) : String(cell);
            // Escape quotes and wrap in quotes if needed
            return `"${cellStr.replace(/"/g, '""')}"`;
          })
          .join(",");
      }),
    ];
    return csvRows.join("\n");
  } else if (typeof jsonData === "object" && jsonData !== null) {
    // Single object
    const headers = Object.keys(jsonData);
    const csvRows = [
      headers.join(","),
      headers
        .map((header) => {
          const cell = jsonData[header];
          const cellStr =
            typeof cell === "object" ? JSON.stringify(cell) : String(cell);
          return `"${cellStr.replace(/"/g, '""')}"`;
        })
        .join(","),
    ];
    return csvRows.join("\n");
  }

  // Fallback for other types
  return String(jsonData);
}

/**
 * Helper function to convert JSON to Markdown
 */
export function convertToMarkdown(jsonData: any, dataType: string): string {
  if (typeof jsonData === "string") {
    try {
      jsonData = JSON.parse(jsonData);
    } catch (e) {
      return jsonData; // Return as-is if not valid JSON
    }
  }

  let markdown = `# ${dataType.toUpperCase()} Data\n\n`;

  if (Array.isArray(jsonData)) {
    // Array of objects
    if (jsonData.length === 0) return markdown + "No data available.";

    const headers = Object.keys(jsonData[0]);

    // Create table header
    markdown += `| ${headers.join(" | ")} |\n`;
    markdown += `| ${headers.map(() => "---").join(" | ")} |\n`;

    // Create table rows
    jsonData.forEach((row) => {
      const rowValues = headers.map((header) => {
        const cell = row[header];
        const cellStr =
          typeof cell === "object" ? JSON.stringify(cell) : String(cell);
        return cellStr.replace(/\|/g, "\\|"); // Escape pipe characters
      });
      markdown += `| ${rowValues.join(" | ")} |\n`;
    });
  } else if (typeof jsonData === "object" && jsonData !== null) {
    // Single object or nested structure
    markdown += "## Properties\n\n";

    Object.entries(jsonData).forEach(([key, value]) => {
      const valueStr =
        typeof value === "object"
          ? JSON.stringify(value, null, 2)
          : String(value);
      markdown += `### ${key}\n\n`;
      markdown += "```\n" + valueStr + "\n```\n\n";
    });
  } else {
    // Simple value
    markdown += "```\n" + String(jsonData) + "\n```\n";
  }

  return markdown;
}
