/**
 * Type definitions for the scraping module
 */

export interface ScrapingConfig {
  id?: string;
  name?: string;
  url: string;
  urls?: string[]; // For multiple mode
  mode: "single" | "multiple" | "scheduled";
  scrapingMode: "basic" | "thorough" | "semantic";
  selector: string;
  selectorType: "css" | "xpath" | "auto";
  categories: string[];
  customEntities?: CustomEntity[]; // Custom entity definitions for advanced categorization
  prebuiltSelectors?: PrebuiltSelector[]; // Prebuilt selectors for common use cases
  options: {
    handleDynamicContent: boolean;
    followPagination: boolean;
    extractImages: boolean;
    deduplicateResults: boolean;
    maxPages: number;
    skipHeadersFooters: boolean;
    skipImagesMedia: boolean;
    stealthMode: boolean;
    respectRobotsTxt: boolean;
    rateLimitDelay: number; // in milliseconds
    proxyUrl?: string; // Optional proxy URL for bypassing restrictions
    userAgent?: string; // Custom user agent
    cookies?: Record<string, string>; // Cookies to send with request
    headers?: Record<string, string>; // Custom headers
    timeout?: number; // Custom timeout in milliseconds
    retryDelay?: number; // Delay between retries in milliseconds
    useAI?: boolean; // Use AI for enhanced extraction
    aiConfidenceThreshold?: number; // Minimum confidence threshold for AI extraction (0-1)
    extractMetadata?: boolean; // Extract metadata like author, date, etc.
    followLinks?: boolean; // Follow links to extract more data
    maxLinkDepth?: number; // Maximum depth for link following
  };
  outputFormat: "json" | "html" | "text" | "structured";
  schedule?: {
    frequency: "daily" | "weekly" | "monthly";
    time: string;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
    daysOfWeek?: number[]; // 0-6, where 0 is Sunday
    timezone?: string; // IANA timezone
    enabled?: boolean; // Whether the schedule is enabled
    lastRun?: string; // ISO date string of the last successful run
    nextRun?: string; // ISO date string of the next scheduled run
  };
  priority?: "high" | "medium" | "low";
  batchId?: string;
  status?:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "retrying"
    | "queued";
  progress?: number; // 0-100
  retryCount?: number;
  maxRetries?: number;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[]; // For organizing and filtering configurations
  owner?: string; // User or system that created this configuration
  notes?: string; // Additional notes about this configuration
  version?: string; // Version of this configuration
  metadata?: {
    lastRun?: string; // ISO date string of the last run
    nextRun?: string; // ISO date string of the next scheduled run
    runCount?: number; // Number of times this job has been run
    successCount?: number; // Number of successful runs
    failureCount?: number; // Number of failed runs
    lastRunStatus?: string; // Status of the last run
    lastRunDuration?: number; // Duration of the last run in milliseconds
    lastRunError?: string; // Error message from the last run
    [key: string]: any; // Allow for additional metadata
  };
}

export interface CustomEntity {
  name: string; // Entity name (e.g., "product_name", "service_title")
  category: string; // Category this entity belongs to
  possibleValues?: string[]; // Possible values for this entity
  selector?: string; // CSS or XPath selector for this entity
  regex?: string; // Regular expression to extract this entity
  required?: boolean; // Whether this entity is required
  description?: string; // Description of this entity
}

export interface PrebuiltSelector {
  name: string; // Name of the selector (e.g., "Product Grid", "Service List")
  description: string; // Description of what this selector targets
  selector: string; // The actual CSS or XPath selector
  selectorType: "css" | "xpath"; // Type of selector
  category: string; // Category this selector is for
  website?: string; // Website this selector is optimized for (optional)
}

export interface CategoryItem {
  id: string;
  title: string;
  content: string;
  source?: string;
  confidence?: number;
  verified?: boolean;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryData {
  items: CategoryItem[];
  description: string;
  metadata?: Record<string, any>;
}

export interface ScrapingResult {
  id: string;
  configId: string;
  url: string;
  timestamp: string;
  status: "success" | "partial" | "failed" | "warning";
  categories: Record<string, CategoryData>;
  raw?: {
    json?: string;
    html?: string;
    text?: string;
    structured?: any;
  };
  metadata?: {
    processingTime?: number;
    pageCount?: number;
    elementCount?: number;
    errors?: string[];
    warnings?: string[];
    suggestions?: string[];
    version?: string;
    [key: string]: any; // Allow for additional metadata
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScrapingError {
  message: string;
  code: string;
  details?: any;
}

export interface ExportOptions {
  format: "json" | "csv" | "excel" | "pdf" | "markdown" | "html" | "text";
  includeMetadata?: boolean;
  fileName?: string;
  categories?: string[];
}
