"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Button } from "../ui/button";
import {
  Download,
  Copy,
  Code,
  FileJson,
  FileText,
  Table,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface DataPreviewProps {
  data?: {
    json?: string;
    html?: string;
    text?: string;
    structured?: any;
  };
  onExport?: (format: string, exportFormat?: string) => void;
  onCopy?: (format: string) => void;
}

const DataPreview = ({
  data = {
    json: JSON.stringify(
      {
        services: [
          {
            name: "Website Development",
            price: "$1,500",
            duration: "2-4 weeks",
          },
          {
            name: "SEO Optimization",
            price: "$750/month",
            duration: "Ongoing",
          },
          { name: "Content Creation", price: "$500", duration: "1 week" },
        ],
        fees: [
          {
            type: "Setup Fee",
            amount: "$250",
            description: "One-time setup charge",
          },
          {
            type: "Maintenance",
            amount: "$100/month",
            description: "Regular updates and monitoring",
          },
        ],
        documents: [
          { name: "Service Agreement", required: true, format: "PDF" },
          {
            name: "Client Questionnaire",
            required: true,
            format: "Online Form",
          },
        ],
      },
      null,
      2,
    ),
    html: '<div class="service-list">\n  <h2>Our Services</h2>\n  <ul>\n    <li>\n      <h3>Website Development</h3>\n      <p>Price: $1,500</p>\n      <p>Duration: 2-4 weeks</p>\n    </li>\n    <li>\n      <h3>SEO Optimization</h3>\n      <p>Price: $750/month</p>\n      <p>Duration: Ongoing</p>\n    </li>\n  </ul>\n</div>',
    text: "Our Services\n\nWebsite Development\nPrice: $1,500\nDuration: 2-4 weeks\n\nSEO Optimization\nPrice: $750/month\nDuration: Ongoing\n\nContent Creation\nPrice: $500\nDuration: 1 week",
  },
  onExport = () => {},
  onCopy = () => {},
}: DataPreviewProps) => {
  const [activeTab, setActiveTab] = useState("json");
  const [exportFormat, setExportFormat] = useState("json");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const contentToCopy = data[activeTab as keyof typeof data] || "";
    navigator.clipboard.writeText(contentToCopy.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy(activeTab);
  };

  const handleExport = () => {
    onExport(activeTab, exportFormat);
  };

  const downloadData = () => {
    try {
      const content = data[activeTab as keyof typeof data] || "";
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
          // Convert to CSV if possible
          if (typeof content === "string" && content.startsWith("{")) {
            try {
              const jsonData = JSON.parse(content);
              exportContent = convertToCSV(jsonData);
            } catch (e) {
              exportContent = content;
            }
          } else {
            exportContent =
              typeof content === "string" ? content : convertToCSV(content);
          }
          mimeType = "text/csv";
          fileExtension = "csv";
          break;
        case "excel":
          // For Excel, we'll use CSV as a simple approximation
          if (typeof content === "string" && content.startsWith("{")) {
            try {
              const jsonData = JSON.parse(content);
              exportContent = convertToCSV(jsonData);
            } catch (e) {
              exportContent = content;
            }
          } else {
            exportContent =
              typeof content === "string" ? content : convertToCSV(content);
          }
          mimeType = "text/csv";
          fileExtension = "csv";
          break;
        case "pdf":
          // PDF generation would require a library, using text for now
          exportContent =
            typeof content === "string"
              ? content
              : JSON.stringify(content, null, 2);
          mimeType = "text/plain";
          fileExtension = "txt";
          break;
        case "markdown":
          if (typeof content === "string" && content.startsWith("{")) {
            try {
              const jsonData = JSON.parse(content);
              exportContent = convertToMarkdown(jsonData, activeTab);
            } catch (e) {
              exportContent = content;
            }
          } else {
            exportContent =
              typeof content === "string"
                ? content
                : convertToMarkdown(content, activeTab);
          }
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
      a.download = `data-${activeTab}-${new Date().toISOString().split("T")[0]}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Also call the provided export handler
      onExport(activeTab, exportFormat);
    } catch (error) {
      console.error(`Error exporting ${activeTab} as ${exportFormat}:`, error);
    }
  };

  // Helper function to convert JSON to CSV
  const convertToCSV = (jsonData: any): string => {
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
  };

  // Helper function to convert JSON to Markdown
  const convertToMarkdown = (jsonData: any, dataType: string): string => {
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
  };

  const renderCodeBlock = (content: string, language: string) => {
    return (
      <pre
        className={cn(
          "relative rounded-md bg-muted p-4 overflow-auto max-h-[300px] text-sm",
          "scrollbar-thin scrollbar-thumb-border scrollbar-track-muted",
        )}
      >
        <code className={`language-${language}`}>{content}</code>
      </pre>
    );
  };

  const renderStructuredData = () => {
    if (!data.structured) return <p>No structured data available</p>;

    try {
      const structuredData =
        typeof data.structured === "string"
          ? JSON.parse(data.structured)
          : data.structured;

      return (
        <div className="space-y-4">
          {Object.entries(structuredData).map(
            ([category, items]: [string, any]) => (
              <div key={category} className="border rounded-md p-3">
                <h4 className="font-medium mb-2 capitalize">{category}</h4>
                <div className="bg-muted rounded-md p-2 overflow-auto max-h-[200px]">
                  <pre className="text-xs">
                    {JSON.stringify(items, null, 2)}
                  </pre>
                </div>
              </div>
            ),
          )}
        </div>
      );
    } catch (error) {
      return <p>Error parsing structured data</p>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-background border rounded-lg shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium">Data Preview</h3>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy current view to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-2">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-[110px] h-9">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
              </SelectContent>
            </Select>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadData}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export data in selected format</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="json"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="p-4 border-b">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="json" className="flex items-center gap-1">
              <FileJson className="h-4 w-4" />
              <span>JSON</span>
            </TabsTrigger>
            <TabsTrigger value="html" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              <span>HTML</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Text</span>
            </TabsTrigger>
            <TabsTrigger value="structured" className="flex items-center gap-1">
              <Table className="h-4 w-4" />
              <span>Structured</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-4 flex-grow overflow-auto">
          <TabsContent value="json" className="mt-0">
            {renderCodeBlock(data.json || "{}", "json")}
          </TabsContent>
          <TabsContent value="html" className="mt-0">
            {renderCodeBlock(data.html || "", "html")}
          </TabsContent>
          <TabsContent value="text" className="mt-0">
            {renderCodeBlock(data.text || "", "text")}
          </TabsContent>
          <TabsContent value="structured" className="mt-0">
            {renderStructuredData()}
          </TabsContent>
        </div>
      </Tabs>

      <div className="p-4 border-t">
        <div className="text-sm text-muted-foreground">
          <p>
            Showing preview for {activeTab.toUpperCase()} format. Export as{" "}
            {exportFormat.toUpperCase()} using the export button above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataPreview;
