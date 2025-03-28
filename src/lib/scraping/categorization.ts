import { CategoryData, CategoryItem } from "@/types/scraping";
import { generateUniqueId } from "@/lib/utils/ids";
import {
  extractItemsFromContent,
  getCategoryKeywords,
} from "./extractItemsFromContent";

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

      // Get category description - now async
      const description = await getCategoryDescription(category);

      // Initialize category data
      categorizedData[categoryKey] = {
        description,
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

    // Look for relationships between products and fees
    if (categorizedData.products && categorizedData.fees) {
      const products = categorizedData.products.items;
      const fees = categorizedData.fees.items;

      // For each product, try to find related fees
      products.forEach((product) => {
        const productTitle = product.title.toLowerCase();
        const relatedFees = fees.filter((fee) => {
          const feeContent = fee.content.toLowerCase();
          return (
            feeContent.includes(productTitle) ||
            productTitle.includes(fee.title.toLowerCase())
          );
        });

        if (relatedFees.length > 0) {
          // Add relationship metadata
          if (!product.metadata) product.metadata = {};
          product.metadata.relatedFees = relatedFees.map((fee) => fee.id);
        }
      });
    }

    // Look for relationships between locations and hours
    if (categorizedData.locations && categorizedData.hours) {
      const locations = categorizedData.locations.items;
      const hours = categorizedData.hours.items;

      // For each location, try to find related hours
      locations.forEach((location) => {
        const locationTitle = location.title.toLowerCase();
        const relatedHours = hours.filter((hour) => {
          const hourContent = hour.content.toLowerCase();
          return (
            hourContent.includes(locationTitle) ||
            locationTitle.includes(hour.title.toLowerCase())
          );
        });

        if (relatedHours.length > 0) {
          // Add relationship metadata
          if (!location.metadata) location.metadata = {};
          location.metadata.relatedHours = relatedHours.map((hour) => hour.id);
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
 * Fetches from API if available, falls back to local defaults
 */
async function getCategoryDescription(category: string): Promise<string> {
  const key = category.toLowerCase();

  try {
    // Try to fetch category description from API
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    // Check if we're in a browser environment
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}${API_BASE_URL}/api/scraping/categories/${key}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache control to avoid excessive API calls
        cache: "force-cache",
      },
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.description) {
        return data.description;
      }
    }

    // Fall back to default descriptions if API fails
    console.info(`Using default description for category: ${key}`);
  } catch (error) {
    console.warn(`Error fetching category description for ${key}:`, error);
    // Continue to fallback - don't throw error to ensure graceful degradation
  }

  // Default descriptions as fallback
  const descriptions: Record<string, string> = {
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

  return descriptions[key] || `Information about ${category}`;
}

/**
 * Extracts items for a specific category from the extracted data
 */
async function extractCategoryItems(
  extractedData: any,
  category: string,
): Promise<CategoryItem[]> {
  // Check if we have structured data for this category
  const categoryKey = category.toLowerCase();
  const items: CategoryItem[] = [];

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
    // If no structured data, extract from content
    const extractedItems = await extractItemsFromContent(
      extractedData,
      category,
    );
    items.push(...extractedItems);
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
        // Extract requirement type if possible
        const requirementMatch = item.content.match(
          /age|income|residency|citizenship|qualification|license|certification/i,
        );
        if (
          requirementMatch &&
          (!item.metadata || !item.metadata.requirementType)
        ) {
          enhancedItem.metadata = {
            ...enhancedItem.metadata,
            requirementType: requirementMatch[0].toLowerCase(),
          };
        }
        break;

      case "products":
        // Extract price and availability if mentioned
        const productPriceMatch = item.content.match(
          /\$\d+(\.\d+)?|\d+ dollars/i,
        );
        const availabilityMatch = item.content.match(
          /in stock|available|out of stock|backordered|pre-order/i,
        );

        enhancedItem.metadata = {
          ...enhancedItem.metadata,
        };

        if (productPriceMatch && !enhancedItem.metadata.price) {
          enhancedItem.metadata.price = productPriceMatch[0];
        }

        if (availabilityMatch && !enhancedItem.metadata.availability) {
          enhancedItem.metadata.availability =
            availabilityMatch[0].toLowerCase();
        }
        break;

      case "contact":
        // Extract contact details
        const emailMatch = item.content.match(
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
        );
        const phoneMatch = item.content.match(/\+?[\d\s()-]{10,}/i);

        enhancedItem.metadata = {
          ...enhancedItem.metadata,
        };

        if (emailMatch && !enhancedItem.metadata.email) {
          enhancedItem.metadata.email = emailMatch[0];
        }

        if (phoneMatch && !enhancedItem.metadata.phone) {
          enhancedItem.metadata.phone = phoneMatch[0];
        }
        break;
    }

    return enhancedItem;
  });
}
