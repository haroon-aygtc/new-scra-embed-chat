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

  const handleCopy = () => {
    const contentToCopy = data[activeTab as keyof typeof data] || "";
    navigator.clipboard.writeText(contentToCopy.toString());
    onCopy(activeTab);
  };

  const handleExport = () => {
    onExport(activeTab, exportFormat);
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
                  <span>Copy</span>
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
                    onClick={handleExport}
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
