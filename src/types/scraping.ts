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
  status: "success" | "partial" | "failed";
  categories: Record<string, CategoryData>;
  raw?: {
    json?: string;
    html?: string;
    text?: string;
  };
  metadata?: {
    processingTime?: number;
    pageCount?: number;
    elementCount?: number;
    errors?: string[];
    warnings?: string[];
    version?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScrapingError {
  message: string;
  code: string;
  details?: any;
}
