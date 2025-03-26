"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RefreshCw,
  Download,
  Filter,
  Settings,
  Clock,
  FileJson,
  FileText,
  FileSpreadsheet,
  File,
  FileCode,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CategoryViewer from "./CategoryViewer";
import DataPreview from "./DataPreview";
import { ScrapingResult, ExportOptions } from "@/types/scraping";

interface ScrapingResultsPanelProps {
  results: ScrapingResult | null;
  lastUpdated: string;
  isLoading?: boolean;
  compact?: boolean;
  onRefresh?: () => void;
  onExportCategories?: (
    category: string,
    format: "json" | "csv" | "excel" | "pdf" | "markdown",
  ) => void;
  onExportRaw?: (format: string, exportFormat?: string) => void;
  onEditCategory?: (category: string, item: any) => void;
  onDeleteCategory?: (category: string, itemId: string) => void;
  onAddCategory?: (category: string) => void;
  onVerifyCategory?: (
    category: string,
    itemId: string,
    verified: boolean,
  ) => void;
}

const ScrapingResultsPanel: React.FC<ScrapingResultsPanelProps> = ({
  results,
  lastUpdated,
  isLoading = false,
  compact = false,
  onRefresh = () => {},
  onExportCategories = () => {},
  onExportRaw = () => {},
  onEditCategory = () => {},
  onDeleteCategory = () => {},
  onAddCategory = () => {},
  onVerifyCategory = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("categories");

  // Default data structure if no results are available
  const defaultData = {
    categories: {
      services: {
        description: "Services offered by the organization",
        items: [],
      },
      fees: {
        description: "Pricing and fee structure",
        items: [],
      },
      documents: {
        description: "Required documents and forms",
        items: [],
      },
      eligibility: {
        description: "Eligibility criteria for services",
        items: [],
      },
      products: {
        description: "Products available for purchase",
        items: [],
      },
      contact: {
        description: "Contact information and support details",
        items: [],
      },
    },
    raw: {
      json: undefined,
      html: undefined,
      text: undefined,
      structured: undefined,
    },
  };

  // Use results data if available, otherwise use default data
  const data = results || defaultData;

  // Handle export with format selection
  const handleExportRaw = (format: string, exportFormat: string = "json") => {
    onExportRaw(format, exportFormat);
  };

  // Handle export categories with format selection
  const handleExportCategory = (
    category: string,
    format: "json" | "csv" | "excel" | "pdf" | "markdown",
  ) => {
    onExportCategories(category, format);
  };

  // Get export icon based on format
  const getExportIcon = (format: string) => {
    switch (format) {
      case "json":
        return <FileJson className="h-4 w-4 mr-2" />;
      case "csv":
        return <FileText className="h-4 w-4 mr-2" />;
      case "excel":
        return <FileSpreadsheet className="h-4 w-4 mr-2" />;
      case "pdf":
        return <File className="h-4 w-4 mr-2" />;
      case "markdown":
        return <FileCode className="h-4 w-4 mr-2" />;
      default:
        return <Download className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div
      className={`w-full h-full bg-background ${!compact ? "rounded-lg border border-border p-4" : ""}`}
    >
      {!compact && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Scraping Results</h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastUpdated}</span>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh scraping results</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="border-b px-4">
          <TabsList className="mt-2">
            <TabsTrigger value="categories">Categorized Data</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="categories" className="mt-0 h-full">
            {!data?.categories || Object.keys(data.categories).length === 0 ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <div className="mx-auto rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
                    <Filter className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="mb-2">
                    No Categorized Data Available
                  </CardTitle>
                  <p className="text-muted-foreground mb-4">
                    Run a scraping operation to extract and categorize data from
                    your target URLs.
                  </p>
                  <Button onClick={onRefresh}>Start Scraping</Button>
                </CardContent>
              </Card>
            ) : (
              <CategoryViewer
                categories={data?.categories || {}}
                onEdit={onEditCategory}
                onDelete={onDeleteCategory}
                onAdd={onAddCategory}
                onExport={handleExportCategory}
                onVerify={onVerifyCategory}
              />
            )}
          </TabsContent>

          <TabsContent value="raw" className="mt-0 h-full">
            {(!data ||
              !data.raw ||
              (!data.raw.json &&
                !data.raw.html &&
                !data.raw.text &&
                !data.raw.structured)) &&
            !isLoading ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <div className="mx-auto rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
                    <Download className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="mb-2">No Raw Data Available</CardTitle>
                  <p className="text-muted-foreground mb-4">
                    Run a scraping operation to extract raw data from your
                    target URLs.
                  </p>
                  <Button onClick={onRefresh}>Start Scraping</Button>
                </CardContent>
              </Card>
            ) : (
              <DataPreview
                data={data && data.raw ? data.raw : {}}
                onExport={handleExportRaw}
                onCopy={() => {}}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ScrapingResultsPanel;
