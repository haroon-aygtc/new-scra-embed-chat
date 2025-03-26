"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Button } from "../ui/button";
import {
  RefreshCw,
  Settings,
  Save,
  Database,
  AlertCircle,
  List,
  BarChart,
  Download,
  FileJson,
  FileText,
  FileSpreadsheet,
  FilePdf,
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import ScrapingConfigPanel from "./ScrapingConfigPanel";
import ScrapingResultsPanel from "./ScrapingResultsPanel";
import QueueManager from "./QueueManager";
import ScrapingAnalytics from "./ScrapingAnalytics";
import {
  ScrapingConfig,
  ScrapingResult,
  ExportOptions,
} from "@/types/scraping";
import {
  performScraping,
  saveScrapingConfiguration,
  loadScrapingConfigurations,
  getScrapingResults,
} from "@/lib/api/scraping";

interface ScrapingDashboardProps {
  onSaveConfiguration?: (config: ScrapingConfig) => void;
  onLoadConfiguration?: () => void;
  isLoading?: boolean;
}

const ScrapingDashboard: React.FC<ScrapingDashboardProps> = ({
  onSaveConfiguration = () => {},
  onLoadConfiguration = () => {},
  isLoading: initialLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState("scraping");
  const [scrapingResults, setScrapingResults] = useState<ScrapingResult | null>(
    null,
  );
  const [lastUpdated, setLastUpdated] = useState<string>("Never");
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load initial results if available
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchInitialResults = async () => {
      try {
        const results = await getScrapingResults();
        if (isMounted && results && results.length > 0) {
          // Get the most recent result
          const latestResult = results[0];
          setScrapingResults(latestResult);
          setLastUpdated(new Date(latestResult.updatedAt).toLocaleString());
        }
      } catch (error) {
        console.error("Error fetching initial results:", error);
        // Don't set error state here to avoid showing error on initial load
      }
    };

    fetchInitialResults();

    // Cleanup function to prevent memory leaks and state updates after unmount
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const handleStartScraping = async (config: ScrapingConfig) => {
    try {
      setIsLoading(true);
      setError(null);

      // For scheduled scraping, handle differently
      if (config.mode === "scheduled") {
        // Save the configuration first
        await saveScrapingConfiguration(config);

        // Show a message about the scheduled job
        setScrapingResults({
          id: `scheduled_${Date.now()}`,
          configId: config.id || "scheduled",
          url: config.url,
          timestamp: new Date().toISOString(),
          status: "pending",
          categories: {},
          raw: {
            text: `Scraping job scheduled to run ${config.schedule?.frequency || "daily"} at ${config.schedule?.time || "12:00"}.`,
          },
          metadata: {
            scheduledFrequency: config.schedule?.frequency,
            scheduledTime: config.schedule?.time,
            version: "1.0.0",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        setLastUpdated(new Date().toLocaleString());
        // Switch to results tab to show the scheduled message
        setActiveTab("results");
        return;
      }

      // Perform the scraping operation for non-scheduled jobs
      const result = await performScraping(config);

      // Update the UI with the results
      setScrapingResults(result);
      setLastUpdated(new Date().toLocaleString());
      // Switch to results tab to show the results
      setActiveTab("results");
    } catch (error: any) {
      console.error("Error performing scraping:", error);
      setError(error.message || "Failed to perform scraping operation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // If we have a previous result, try to refresh it
      if (scrapingResults) {
        const config: ScrapingConfig = {
          url: scrapingResults.url,
          mode: "single",
          scrapingMode: "basic",
          selector: ".content",
          selectorType: "auto",
          categories: Object.keys(scrapingResults.categories).map(
            (key) => key.charAt(0).toUpperCase() + key.slice(1),
          ),
          options: {
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
          },
          outputFormat: "json",
        };

        // Perform the scraping operation
        const result = await performScraping(config);

        // Update the UI with the results
        setScrapingResults(result);
        setLastUpdated(new Date().toLocaleString());
      } else {
        setError("No previous scraping results to refresh");
      }
    } catch (error: any) {
      console.error("Error refreshing scraping:", error);
      setError(error.message || "Failed to refresh scraping operation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfiguration = async (config: ScrapingConfig) => {
    try {
      setIsSaving(true);
      setError(null);

      // Save the configuration
      await saveScrapingConfiguration(config);

      // Call the onSaveConfiguration prop if provided
      onSaveConfiguration(config);
    } catch (error: any) {
      console.error("Error saving configuration:", error);
      setError(error.message || "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle exporting raw data
  const handleExportRaw = (format: string, exportFormat: string = "json") => {
    if (!scrapingResults || !scrapingResults.raw) return;

    try {
      const content =
        scrapingResults.raw[format as keyof typeof scrapingResults.raw];
      if (!content) return;

      let exportContent: string;
      let mimeType: string;
      let fileExtension: string;

      // Process content based on export format
      switch (exportFormat) {
        case "json":
          exportContent =
            typeof content === "string"
              ? content
              : JSON.stringify(content, null, 2);
          mimeType = "application/json";
          fileExtension = "json";
          break;
        case "csv":
          // Convert JSON to CSV
          exportContent = convertToCSV(content);
          mimeType = "text/csv";
          fileExtension = "csv";
          break;
        case "excel":
          // For Excel, we'll use CSV as a simple approximation
          exportContent = convertToCSV(content);
          mimeType = "text/csv";
          fileExtension = "csv"; // Excel would be .xlsx but requires additional libraries
          break;
        case "pdf":
          // PDF generation would require a library, using text for now
          exportContent =
            typeof content === "string"
              ? content
              : JSON.stringify(content, null, 2);
          mimeType = "text/plain";
          fileExtension = "txt"; // Using .txt as PDF requires additional libraries
          break;
        case "markdown":
          exportContent = convertToMarkdown(content, format);
          mimeType = "text/markdown";
          fileExtension = "md";
          break;
        default:
          exportContent =
            typeof content === "string"
              ? content
              : JSON.stringify(content, null, 2);
          mimeType = "text/plain";
          fileExtension = "txt";
      }

      // Create and download the file
      const blob = new Blob([exportContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scraping-${format}-${new Date().toISOString().split("T")[0]}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error exporting ${format} as ${exportFormat}:`, error);
      setError(`Failed to export ${format} as ${exportFormat}`);
    }
  };

  // Handle exporting category data
  const handleExportCategory = (
    category: string,
    format: "json" | "csv" | "excel" | "pdf" | "markdown",
  ) => {
    if (
      !scrapingResults ||
      !scrapingResults.categories ||
      !scrapingResults.categories[category]
    )
      return;

    try {
      const categoryData = scrapingResults.categories[category];
      let exportContent: string;
      let mimeType: string;
      let fileExtension: string;

      // Process content based on export format
      switch (format) {
        case "json":
          exportContent = JSON.stringify(categoryData, null, 2);
          mimeType = "application/json";
          fileExtension = "json";
          break;
        case "csv":
          exportContent = convertCategoryToCSV(categoryData);
          mimeType = "text/csv";
          fileExtension = "csv";
          break;
        case "excel":
          exportContent = convertCategoryToCSV(categoryData);
          mimeType = "text/csv";
          fileExtension = "csv";
          break;
        case "pdf":
          exportContent = JSON.stringify(categoryData, null, 2);
          mimeType = "text/plain";
          fileExtension = "txt";
          break;
        case "markdown":
          exportContent = convertCategoryToMarkdown(categoryData, category);
          mimeType = "text/markdown";
          fileExtension = "md";
          break;
        default:
          exportContent = JSON.stringify(categoryData, null, 2);
          mimeType = "text/plain";
          fileExtension = "txt";
      }

      // Create and download the file
      const blob = new Blob([exportContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${category}-${new Date().toISOString().split("T")[0]}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error exporting ${category} as ${format}:`, error);
      setError(`Failed to export ${category} as ${format}`);
    }
  };

  // Helper function to convert JSON to CSV
  const convertToCSV = (content: any): string => {
    if (typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch (e) {
        return content; // Return as-is if not valid JSON
      }
    }

    // Handle different data structures
    if (Array.isArray(content)) {
      // Array of objects
      if (content.length === 0) return "";

      const headers = Object.keys(content[0]);
      const csvRows = [
        headers.join(","), // Header row
        ...content.map((row) => {
          return headers
            .map((header) => {
              const cell = row[header];
              // Handle nested objects and arrays
              const cellStr =
                typeof cell === "object" ? JSON.stringify(cell) : String(cell);
              // Escape quotes and wrap in quotes if contains comma
              return `"${cellStr.replace(/"/g, '""')}"`;
            })
            .join(",");
        }),
      ];

      return csvRows.join("\n");
    } else if (typeof content === "object" && content !== null) {
      // Single object or nested structure
      const flattenedData = flattenObject(content);
      const rows = Object.entries(flattenedData).map(([key, value]) => {
        return `"${key}","${String(value).replace(/"/g, '""')}"`;
      });

      return rows.join("\n");
    }

    return String(content);
  };

  // Helper function to flatten nested objects
  const flattenObject = (obj: any, prefix = ""): Record<string, any> => {
    return Object.keys(obj).reduce((acc: Record<string, any>, k: string) => {
      const pre = prefix.length ? `${prefix}.` : "";
      if (
        typeof obj[k] === "object" &&
        obj[k] !== null &&
        !Array.isArray(obj[k])
      ) {
        Object.assign(acc, flattenObject(obj[k], `${pre}${k}`));
      } else if (Array.isArray(obj[k])) {
        acc[`${pre}${k}`] = JSON.stringify(obj[k]);
      } else {
        acc[`${pre}${k}`] = obj[k];
      }
      return acc;
    }, {});
  };

  // Helper function to convert category data to CSV
  const convertCategoryToCSV = (categoryData: any): string => {
    if (
      !categoryData.items ||
      !Array.isArray(categoryData.items) ||
      categoryData.items.length === 0
    ) {
      return "No items found";
    }

    // Get all possible headers from all items
    const allHeaders = new Set<string>();
    categoryData.items.forEach((item: any) => {
      Object.keys(item).forEach((key) => {
        if (key !== "metadata") allHeaders.add(key);
      });
      // Add metadata keys with prefix
      if (item.metadata) {
        Object.keys(item.metadata).forEach((key) => {
          allHeaders.add(`metadata.${key}`);
        });
      }
    });

    const headers = Array.from(allHeaders);

    // Create CSV rows
    const csvRows = [
      headers.join(","), // Header row
      ...categoryData.items.map((item: any) => {
        return headers
          .map((header) => {
            let value;
            if (header.startsWith("metadata.")) {
              const metaKey = header.substring(9);
              value =
                item.metadata && item.metadata[metaKey] !== undefined
                  ? item.metadata[metaKey]
                  : "";
            } else {
              value = item[header] !== undefined ? item[header] : "";
            }

            // Handle objects and arrays
            const valueStr =
              typeof value === "object" ? JSON.stringify(value) : String(value);
            // Escape quotes and wrap in quotes
            return `"${valueStr.replace(/"/g, '""')}"`;
          })
          .join(",");
      }),
    ];

    return csvRows.join("\n");
  };

  // Helper function to convert content to Markdown
  const convertToMarkdown = (content: any, format: string): string => {
    if (typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch (e) {
        // If not valid JSON, format as code block
        return `# Scraped ${format.toUpperCase()} Content\n\n\`\`\`\n${content}\n\`\`\`\n`;
      }
    }

    let markdown = `# Scraped ${format.toUpperCase()} Content\n\n`;

    if (Array.isArray(content)) {
      // Array of objects
      markdown += `## Items (${content.length})\n\n`;

      content.forEach((item, index) => {
        markdown += `### Item ${index + 1}\n\n`;
        markdown += objectToMarkdown(item, 0);
        markdown += "\n";
      });
    } else if (typeof content === "object" && content !== null) {
      // Object
      markdown += objectToMarkdown(content, 0);
    } else {
      // Primitive value
      markdown += `\`\`\`\n${content}\n\`\`\`\n`;
    }

    return markdown;
  };

  // Helper function to convert category data to Markdown
  const convertCategoryToMarkdown = (
    categoryData: any,
    categoryName: string,
  ): string => {
    let markdown = `# ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}\n\n`;

    // Add description
    if (categoryData.description) {
      markdown += `${categoryData.description}\n\n`;
    }

    // Add metadata if available
    if (categoryData.metadata) {
      markdown += `## Metadata\n\n`;
      markdown += objectToMarkdown(categoryData.metadata, 0);
      markdown += "\n";
    }

    // Add items
    if (categoryData.items && Array.isArray(categoryData.items)) {
      markdown += `## Items (${categoryData.items.length})\n\n`;

      categoryData.items.forEach((item: any, index: number) => {
        markdown += `### ${item.title || `Item ${index + 1}`}\n\n`;

        // Add content
        if (item.content) {
          markdown += `${item.content}\n\n`;
        }

        // Add other properties except metadata
        const otherProps = Object.entries(item).filter(
          ([key]) => key !== "title" && key !== "content" && key !== "metadata",
        );

        if (otherProps.length > 0) {
          markdown += `#### Properties\n\n`;
          otherProps.forEach(([key, value]) => {
            markdown += `- **${key}**: ${value}\n`;
          });
          markdown += "\n";
        }

        // Add metadata if available
        if (item.metadata) {
          markdown += `#### Metadata\n\n`;
          markdown += objectToMarkdown(item.metadata, 0);
          markdown += "\n";
        }
      });
    }

    return markdown;
  };

  // Helper function to convert object to Markdown
  const objectToMarkdown = (obj: any, depth: number): string => {
    let markdown = "";
    const indent = "  ".repeat(depth);

    Object.entries(obj).forEach(([key, value]) => {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        markdown += `${indent}- **${key}**:\n${objectToMarkdown(value, depth + 1)}`;
      } else if (Array.isArray(value)) {
        markdown += `${indent}- **${key}**:\n`;
        if (value.length === 0) {
          markdown += `${indent}  - *Empty array*\n`;
        } else {
          value.forEach((item, i) => {
            if (typeof item === "object" && item !== null) {
              markdown += `${indent}  - Item ${i + 1}:\n${objectToMarkdown(item, depth + 2)}`;
            } else {
              markdown += `${indent}  - ${item}\n`;
            }
          });
        }
      } else {
        markdown += `${indent}- **${key}**: ${value}\n`;
      }
    });

    return markdown;
  };

  return (
    <div className="w-full h-full bg-background p-4 rounded-lg shadow-sm border">
      <Tabs
        defaultValue="scraping"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="scraping" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Queue
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeTab === "results" && scrapingResults && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-1"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </Button>
            )}

            {activeTab === "scraping" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveConfiguration({} as ScrapingConfig)}
                className="flex items-center gap-1"
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
                <span>Save Configuration</span>
              </Button>
            )}

            {activeTab === "results" && scrapingResults && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleExportRaw("json", "json")}
                    className="flex items-center gap-2"
                  >
                    <FileJson className="h-4 w-4" /> Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportRaw("text", "csv")}
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportRaw("text", "markdown")}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" /> Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportRaw("text", "pdf")}
                    className="flex items-center gap-2"
                  >
                    <FilePdf className="h-4 w-4" /> Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <TabsContent value="scraping" className="mt-0">
          <ScrapingConfigPanel
            onStartScraping={handleStartScraping}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="results" className="mt-0">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Scraping in progress...
                </p>
              </div>
            </div>
          ) : scrapingResults ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  Results for {scrapingResults.url}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Last updated: {lastUpdated}
                </p>
              </div>
              <ScrapingResultsPanel
                results={scrapingResults}
                lastUpdated={lastUpdated}
                onRefresh={handleRefresh}
                onExportCategories={handleExportCategory}
                onExportRaw={handleExportRaw}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-2">
                <Database className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No scraping results yet. Configure and start scraping to see
                  results here.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="queue" className="mt-0">
          <QueueManager />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <ScrapingAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScrapingDashboard;
