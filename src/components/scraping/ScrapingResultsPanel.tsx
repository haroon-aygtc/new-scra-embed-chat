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
  Save,
  Database,
  HardDrive,
  Server,
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  const [showStorageDialog, setShowStorageDialog] = useState(false);
  const [storageLocation, setStorageLocation] = useState("local");
  const [customFilename, setCustomFilename] = useState("");
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);

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

  // Handle saving data to JSON file
  const handleSaveToJson = () => {
    if (!results) return;

    try {
      // Create a JSON string from the results
      const jsonData = JSON.stringify(results, null, 2);

      // Create a blob and download link
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        customFilename ||
        `scraping-results-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving to JSON:", error);
      setSaveSuccess(false);
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  return (
    <div
      className={`w-full h-full bg-background ${!compact ? "rounded-lg border border-border p-4" : ""}`}
    >
      {!compact && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Scraping Results</h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastUpdated}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end md:self-auto">
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

            <Dialog
              open={showStorageDialog}
              onOpenChange={setShowStorageDialog}
            >
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Store Data</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Store Scraping Results</DialogTitle>
                  <DialogDescription>
                    Choose where to store your scraped data and configure
                    storage options.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${storageLocation === "local" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                      onClick={() => setStorageLocation("local")}
                    >
                      <HardDrive className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-medium">Local JSON</span>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${storageLocation === "database" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                      onClick={() => setStorageLocation("database")}
                    >
                      <Database className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-medium">Database</span>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${storageLocation === "server" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                      onClick={() => setStorageLocation("server")}
                    >
                      <Server className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-medium">Server</span>
                    </div>
                  </div>

                  {storageLocation === "local" && (
                    <div className="space-y-2">
                      <Label htmlFor="filename">Filename</Label>
                      <Input
                        id="filename"
                        placeholder="scraping-results.json"
                        value={customFilename}
                        onChange={(e) => setCustomFilename(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use auto-generated filename with date
                      </p>
                    </div>
                  )}

                  {storageLocation === "database" && (
                    <div className="space-y-2">
                      <p className="text-sm">
                        Data will be stored in the connected database with
                        automatic versioning.
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          MySQL
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          PostgreSQL
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          MongoDB
                        </Badge>
                      </div>
                    </div>
                  )}

                  {storageLocation === "server" && (
                    <div className="space-y-2">
                      <p className="text-sm">
                        Data will be stored on the server in the configured data
                        directory.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Path: /data/results/
                      </p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowStorageDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      handleSaveToJson();
                      setShowStorageDialog(false);
                    }}
                  >
                    Save Data
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {saveSuccess !== null && (
              <div
                className={`text-sm ${saveSuccess ? "text-green-500" : "text-red-500"} animate-in fade-in slide-in-from-top-5 duration-300`}
              >
                {saveSuccess ? "Data saved successfully!" : "Error saving data"}
              </div>
            )}
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
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      onClick={onRefresh}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Start Scraping
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowStorageDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Storage Options
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="text-sm font-medium">Categorized Data</h3>
                      <p className="text-xs text-muted-foreground">
                        AI-powered categorization of scraped content
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStorageDialog(true)}
                        className="flex items-center gap-1"
                      >
                        <Save className="h-3 w-3" />
                        Store
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={() =>
                                handleExportCategory("services", "json")
                              }
                              className="flex items-center gap-2"
                            >
                              <FileJson className="h-4 w-4" /> Services as JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleExportCategory("fees", "json")
                              }
                              className="flex items-center gap-2"
                            >
                              <FileJson className="h-4 w-4" /> Fees as JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleExportCategory("documents", "json")
                              }
                              className="flex items-center gap-2"
                            >
                              <FileJson className="h-4 w-4" /> Documents as JSON
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleExportRaw("json", "json")}
                            className="flex items-center gap-2"
                          >
                            <FileJson className="h-4 w-4" /> All Categories
                            (JSON)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExportRaw("text", "csv")}
                            className="flex items-center gap-2"
                          >
                            <FileSpreadsheet className="h-4 w-4" /> All
                            Categories (CSV)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                <CategoryViewer
                  categories={data?.categories || {}}
                  onEdit={onEditCategory}
                  onDelete={onDeleteCategory}
                  onAdd={onAddCategory}
                  onExport={handleExportCategory}
                  onVerify={onVerifyCategory}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="raw" className="mt-0 h-full">
            {!data |
              !data.raw |
              (!data.raw.json &&
                !data.raw.html &&
                !data.raw.text &&
                !data.raw.structured) && !isLoading ? (
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
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      onClick={onRefresh}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Start Scraping
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowStorageDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Storage Options
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="text-sm font-medium">Raw Scraped Data</h3>
                      <p className="text-xs text-muted-foreground">
                        Unprocessed data extracted from the target URL
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStorageDialog(true)}
                        className="flex items-center gap-1"
                      >
                        <Save className="h-3 w-3" />
                        Store
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
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
                              <FileSpreadsheet className="h-4 w-4" /> Export as
                              CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleExportRaw("text", "markdown")
                              }
                              className="flex items-center gap-2"
                            >
                              <FileText className="h-4 w-4" /> Export as
                              Markdown
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExportRaw("text", "pdf")}
                              className="flex items-center gap-2"
                            >
                              <File className="h-4 w-4" /> Export as PDF
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                <DataPreview
                  data={data && data.raw ? data.raw : {}}
                  onExport={handleExportRaw}
                  onCopy={() => {}}
                />
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ScrapingResultsPanel;
