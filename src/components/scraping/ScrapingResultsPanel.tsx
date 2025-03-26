"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Download, Filter, Settings } from "lucide-react";
import CategoryViewer from "./CategoryViewer";
import DataPreview from "./DataPreview";

interface ScrapingResultsPanelProps {
  isLoading?: boolean;
  lastUpdated?: string;
  data?: {
    categories?: Record<string, any>;
    raw?: {
      json?: string;
      html?: string;
      text?: string;
    };
  };
  onRefresh?: () => void;
  onExportCategories?: (
    category: string,
    format: "json" | "csv" | "txt",
  ) => void;
  onExportRaw?: (format: string) => void;
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
  isLoading = false,
  lastUpdated = "Never",
  data = {
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
    },
    raw: {
      json: undefined,
      html: undefined,
      text: undefined,
    },
  },
  onRefresh = () => {},
  onExportCategories = () => {},
  onExportRaw = () => {},
  onEditCategory = () => {},
  onDeleteCategory = () => {},
  onAddCategory = () => {},
  onVerifyCategory = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <div className="w-full h-full flex flex-col bg-background rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-xl font-semibold">Scraping Results</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefresh()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </Button>
          <Button variant="outline" size="sm" disabled={isLoading}>
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" disabled={isLoading}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

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
            {!data?.categories && !isLoading ? (
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
                onExport={onExportCategories}
                onVerify={onVerifyCategory}
              />
            )}
          </TabsContent>

          <TabsContent value="raw" className="mt-0 h-full">
            {(!data ||
              !data.raw ||
              (!data.raw.json && !data.raw.html && !data.raw.text)) &&
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
                onExport={onExportRaw}
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
