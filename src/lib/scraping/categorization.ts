import { CategoryData, CategoryItem } from "@/types/scraping";
import { generateUniqueId } from "@/lib/utils/ids";

/**
 * Categorizes content based on extracted data and specified categories
 */
export async function categorizeContent(
  extractedData: any,
  categories: string[],
): Promise<Record<string, CategoryData>> {
  try {
    const categorizedData: Record<string, CategoryData> = {};
    const startTime = Date.now();

    // Process each category
    for (const category of categories) {
      const categoryKey = category.toLowerCase();

      // Initialize category data
      categorizedData[categoryKey] = {
        description: getCategoryDescription(category),
        items: [],
        metadata: {
          processingTime: 0,
          confidence: 0,
          extractionMethod: extractedData.structured
            ? "structured"
            : "content-based",
          itemCount: 0,
        },
      };

      // Extract items for this category
      const items = await extractCategoryItems(extractedData, category);

      // Calculate average confidence
      const totalConfidence = items.reduce(
        (sum, item) => sum + (item.confidence || 0),
        0,
      );
      const avgConfidence =
        items.length > 0 ? totalConfidence / items.length : 0;

      // Add items to the category
      categorizedData[categoryKey].items = items;
      categorizedData[categoryKey].metadata = {
        processingTime: Date.now() - startTime,
        confidence: avgConfidence,
        extractionMethod: extractedData.structured
          ? "structured"
          : "content-based",
        itemCount: items.length,
        source: extractedData.url || "unknown",
      };
    }

    // Add cross-category relationships if possible
    if (Object.keys(categorizedData).length > 1) {
      addCrossCategoryRelationships(categorizedData);
    }

    return categorizedData;
  } catch (error) {
    console.error("Error categorizing content:", error);
    throw error;
  }
}

/**
 * Adds relationships between items across different categories
 */
function addCrossCategoryRelationships(
  categorizedData: Record<string, CategoryData>,
): void {
  try {
    const categories = Object.keys(categorizedData);

    // Skip if there are not enough categories
    if (categories.length < 2) return;

    // Look for relationships between services and fees
    if (categorizedData.services && categorizedData.fees) {
      const services = categorizedData.services.items;
      const fees = categorizedData.fees.items;

      // For each service, try to find related fees
      services.forEach((service) => {
        const serviceTitle = service.title.toLowerCase();
        const relatedFees = fees.filter((fee) => {
          const feeContent = fee.content.toLowerCase();
          return (
            feeContent.includes(serviceTitle) ||
            serviceTitle.includes(fee.title.toLowerCase())
          );
        });

        if (relatedFees.length > 0) {
          // Add relationship metadata
          if (!service.metadata) service.metadata = {};
          service.metadata.relatedFees = relatedFees.map((fee) => fee.id);
        }
      });

      // Update metadata to indicate relationships were processed
      if (!categorizedData.services.metadata)
        categorizedData.services.metadata = {};
      categorizedData.services.metadata.relationshipsProcessed = true;
    }

    // Look for relationships between services and eligibility
    if (categorizedData.services && categorizedData.eligibility) {
      const services = categorizedData.services.items;
      const eligibility = categorizedData.eligibility.items;

      // For each service, try to find related eligibility criteria
      services.forEach((service) => {
        const serviceTitle = service.title.toLowerCase();
        const relatedEligibility = eligibility.filter((elig) => {
          const eligContent = elig.content.toLowerCase();
          return (
            eligContent.includes(serviceTitle) ||
            serviceTitle.includes(elig.title.toLowerCase())
          );
        });

        if (relatedEligibility.length > 0) {
          // Add relationship metadata
          if (!service.metadata) service.metadata = {};
          service.metadata.relatedEligibility = relatedEligibility.map(
            (elig) => elig.id,
          );
        }
      });
    }

    // Look for relationships between services and documents
    if (categorizedData.services && categorizedData.documents) {
      const services = categorizedData.services.items;
      const documents = categorizedData.documents.items;

      // For each service, try to find related documents
      services.forEach((service) => {
        const serviceTitle = service.title.toLowerCase();
        const relatedDocuments = documents.filter((doc) => {
          const docContent = doc.content.toLowerCase();
          return (
            docContent.includes(serviceTitle) ||
            serviceTitle.includes(doc.title.toLowerCase())
          );
        });

        if (relatedDocuments.length > 0) {
          // Add relationship metadata
          if (!service.metadata) service.metadata = {};
          service.metadata.relatedDocuments = relatedDocuments.map(
            (doc) => doc.id,
          );
        }
      });
    }
  } catch (error) {
    console.error("Error adding cross-category relationships:", error);
    // Don't throw, just log the error as this is an enhancement
  }
}

/**
 * Returns a description for a category
 */
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    services: "Services offered by the organization",
    fees: "Pricing and fee structure",
    documents: "Required documents and forms",
    eligibility: "Eligibility criteria for services",
  };

  const key = category.toLowerCase();
  return descriptions[key] || `Information about ${category}`;
}

/**
 * Extracts items for a specific category from the extracted data
 */
async function extractCategoryItems(
  extractedData: any,
  category: string,
): Promise<CategoryItem[]> {
  // In a production environment, this would use NLP and ML techniques
  // For this implementation, we'll create items based on the extracted data

  const items: CategoryItem[] = [];
  const categoryKey = category.toLowerCase();

  // Check if we have structured data for this category
  if (extractedData.structured && extractedData.structured[categoryKey]) {
    const categoryData = extractedData.structured[categoryKey];

    // Convert structured data to category items
    if (Array.isArray(categoryData.items)) {
      for (const item of categoryData.items) {
        items.push({
          id: generateUniqueId(),
          title: item.title || "",
          content: item.description || "",
          source: extractedData.url || "",
          confidence: 0.9,
          verified: false,
          metadata: {
            ...item,
            extractionMethod: "structured",
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  } else {
    // If no structured data, try to extract from content
    // For demo purposes, add sample items for eligibility category
    if (categoryKey === "eligibility") {
      items.push(
        createSampleItem(
          "Business Clients",
          "Available for registered businesses with valid business identification.",
        ),
        createSampleItem(
          "Individual Clients",
          "Available for individuals with valid ID and proof of address.",
        ),
      );
    } else {
      // For other categories, use content extraction
      const extractedItems = await extractItemsFromContent(
        extractedData,
        category,
      );
      items.push(...extractedItems);
    }
  }

  // Apply post-processing to improve quality
  const processedItems = postProcessCategoryItems(items, category);

  return processedItems;
}

/**
 * Post-processes category items to improve quality
 */
function postProcessCategoryItems(
  items: CategoryItem[],
  category: string,
): CategoryItem[] {
  // Skip if no items
  if (items.length === 0) return items;

  // Make a copy to avoid modifying the original
  const processedItems = [...items];

  // Remove duplicates based on title similarity
  const uniqueItems: CategoryItem[] = [];
  const seenTitles = new Set<string>();

  processedItems.forEach((item) => {
    // Normalize title for comparison
    const normalizedTitle = item.title.toLowerCase().trim();

    // Skip if we've seen this title or a very similar one
    if (seenTitles.has(normalizedTitle)) return;

    // Check for similar titles (simple check - in production would use more sophisticated similarity)
    let isDuplicate = false;
    for (const seenTitle of seenTitles) {
      if (
        normalizedTitle.includes(seenTitle) ||
        seenTitle.includes(normalizedTitle)
      ) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seenTitles.add(normalizedTitle);
      uniqueItems.push(item);
    }
  });

  // Sort by confidence (highest first)
  uniqueItems.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  // Enhance items based on category-specific rules
  return uniqueItems.map((item) => {
    // Make a copy to avoid modifying the original
    const enhancedItem = { ...item };

    // Apply category-specific enhancements
    switch (category.toLowerCase()) {
      case "services":
        // Extract price if mentioned in content
        const priceMatch = item.content.match(/\$\d+(\.\d+)?|\d+ dollars/i);
        if (priceMatch && (!item.metadata || !item.metadata.price)) {
          enhancedItem.metadata = {
            ...enhancedItem.metadata,
            price: priceMatch[0],
            hasPriceInfo: true,
          };
        }
        break;

      case "fees":
        // Ensure fee items have amount information
        if (!item.metadata) enhancedItem.metadata = {};

        // Extract amount if not already present
        if (!enhancedItem.metadata.amount) {
          const amountMatch = item.content.match(/\$\d+(\.\d+)?|\d+ dollars/i);
          if (amountMatch) {
            enhancedItem.metadata.amount = amountMatch[0];
          }
        }
        break;

      case "documents":
        // Extract document type if mentioned
        const docTypeMatch = item.content.match(
          /pdf|docx?|form|application|agreement|contract/i,
        );
        if (docTypeMatch && (!item.metadata || !item.metadata.documentType)) {
          enhancedItem.metadata = {
            ...enhancedItem.metadata,
            documentType: docTypeMatch[0].toLowerCase(),
          };
        }
        break;

      case "eligibility":
        // No specific enhancements for eligibility yet
        break;
    }

    return enhancedItem;
  });
}

/**
 * Creates a sample category item
 */
function createSampleItem(title: string, content: string): CategoryItem {
  return {
    id: generateUniqueId(),
    title,
    content,
    confidence: 0.5,
    verified: false,
  };
}

/**
 * Returns keywords for a category
 */
function getCategoryKeywords(category: string): string[] {
  const keywords: Record<string, string[]> = {
    services: ["service", "offering", "solution", "product", "package"],
    fees: ["fee", "price", "cost", "pricing", "payment", "rate", "charge"],
    documents: [
      "document",
      "form",
      "file",
      "paperwork",
      "agreement",
      "contract",
    ],
    eligibility: [
      "eligibility",
      "requirement",
      "qualify",
      "criteria",
      "eligible",
    ],
  };

  const key = category.toLowerCase();
  return keywords[key] || [key];
}

/**
 * Checks if text contains any of the keywords
 */
function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()));
}
