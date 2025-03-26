"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Link2,
  Settings,
  List,
  FileJson,
  Clock,
  RefreshCw,
  AlertCircle,
  Save,
  Plus,
  X,
  Loader2,
  Download,
  Upload,
  FileText,
  MousePointer,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../ui/dialog";
import HelpTooltip from "./HelpTooltip";
import SavedConfigsList from "./SavedConfigsList";
import VisualSelectorBuilder from "./VisualSelectorBuilder";
import { ScrapingConfig } from "@/types/scraping";
import { performScraping, saveScrapingConfiguration } from "@/lib/api/scraping";

interface ScrapingConfigPanelProps {
  onStartScraping?: (config: ScrapingConfig) => void;
  isLoading?: boolean;
}

const defaultConfig: ScrapingConfig = {
  url: "https://example.com",
  mode: "single",
  scrapingMode: "basic",
  selector: ".content",
  selectorType: "css",
  categories: ["Services", "Fees", "Documents", "Eligibility"],
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
  priority: "medium",
  maxRetries: 3,
};

const ScrapingConfigPanel: React.FC<ScrapingConfigPanelProps> = ({
  onStartScraping = () => {},
  isLoading = false,
}) => {
  const [config, setConfig] = useState<ScrapingConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState("basic");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showSavedConfigs, setShowSavedConfigs] = useState(false);
  const [showVisualBuilder, setShowVisualBuilder] = useState(false);
  const [configName, setConfigName] = useState("");

  // Validate URL when it changes
  useEffect(() => {
    if (config.url && !isValidUrl(config.url)) {
      setError("Please enter a valid URL including http:// or https://");
    } else {
      setError(null);
    }
  }, [config.url]);

  // Initialize schedule with defaults if mode is changed to scheduled
  useEffect(() => {
    if (config.mode === "scheduled" && !config.schedule) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      setConfig({
        ...config,
        schedule: {
          frequency: "daily",
          time: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
          daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday by default
        },
      });
    }
  }, [config.mode]);

  // Clear saved message after 3 seconds
  useEffect(() => {
    if (savedMessage) {
      const timer = setTimeout(() => {
        setSavedMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [savedMessage]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, url: e.target.value });
  };

  const handleModeChange = (value: "single" | "multiple" | "scheduled") => {
    if (value === "multiple" && !config.urls) {
      // Initialize urls array with current URL if switching to multiple mode
      setConfig({
        ...config,
        mode: value,
        urls: config.url ? [config.url] : [],
      });
    } else {
      setConfig({ ...config, mode: value });
    }
  };

  const handleSelectorTypeChange = (value: "css" | "xpath" | "auto") => {
    setConfig({ ...config, selectorType: value });
  };

  const handleSelectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, selector: e.target.value });
  };

  const handleOutputFormatChange = (
    value: "json" | "html" | "text" | "structured",
  ) => {
    setConfig({ ...config, outputFormat: value });
  };

  const handleOptionChange = (
    option: keyof ScrapingConfig["options"],
    value: boolean | number,
  ) => {
    setConfig({
      ...config,
      options: {
        ...config.options,
        [option]: value,
      },
    });
  };

  const handleStartScraping = async () => {
    // Validate URLs based on mode
    if (config.mode === "multiple") {
      if (!config.urls || config.urls.length === 0) {
        setError("Please add at least one URL");
        return;
      }

      // Check if all URLs are valid
      const invalidUrls = config.urls.filter((url) => !isValidUrl(url));
      if (invalidUrls.length > 0) {
        setError(
          `Please enter valid URLs including http:// or https:// (${invalidUrls.length} invalid URLs)`,
        );
        return;
      }
    } else {
      // Single URL mode
      if (!isValidUrl(config.url)) {
        setError("Please enter a valid URL including http:// or https://");
        return;
      }
    }

    try {
      // Call the parent component's onStartScraping function
      onStartScraping(config);

      // Also perform the actual scraping using our API service
      const result = await performScraping(config);
      console.log("Scraping result:", result);

      // Check if the result is a queued job
      if (result.status === "queued") {
        // Show a message about the queued job
        setSavedMessage(
          `Job added to queue with ID: ${result.jobId}. Check the Queue tab for status.`,
        );
      }

      // The result will be handled by the parent component through the onStartScraping callback
    } catch (error: any) {
      console.error("Error starting scraping:", error);
      setError(error.message || "Failed to start scraping operation");
    }
  };

  const handleSaveConfiguration = async () => {
    if (!isValidUrl(config.url)) {
      setError("Please enter a valid URL including http:// or https://");
      return;
    }

    try {
      setIsSaving(true);
      // Add name to config if provided
      const configToSave = {
        ...config,
        name: configName || `Config ${new Date().toLocaleString()}`,
      };

      const savedConfig = await saveScrapingConfiguration(configToSave);
      console.log("Saved configuration:", savedConfig);
      setSavedMessage("Configuration saved successfully");

      // Update the current config with the saved one
      setConfig(savedConfig);
    } catch (error: any) {
      console.error("Error saving configuration:", error);
      setError(error.message || "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadConfig = (loadedConfig: ScrapingConfig) => {
    setConfig(loadedConfig);
    setConfigName(loadedConfig.name || "");
    setShowSavedConfigs(false);
    setSavedMessage("Configuration loaded successfully");
  };

  const handleExportConfig = () => {
    try {
      const configToExport = {
        ...config,
        name: configName || `Config ${new Date().toLocaleString()}`,
      };

      const blob = new Blob([JSON.stringify(configToExport, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scraping-config-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSavedMessage("Configuration exported successfully");
    } catch (error: any) {
      console.error("Error exporting configuration:", error);
      setError(error.message || "Failed to export configuration");
    }
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedConfig = JSON.parse(event.target?.result as string);
        setConfig(importedConfig);
        setConfigName(importedConfig.name || "");
        setSavedMessage("Configuration imported successfully");
      } catch (error: any) {
        console.error("Error parsing imported configuration:", error);
        setError("Invalid configuration file");
      }
    };
    reader.readAsText(file);

    // Reset the input value so the same file can be selected again
    e.target.value = "";
  };

  const handleVisualSelectorSave = (selectors: any) => {
    // Update the config with the generated selectors
    if (selectors && (selectors.css || selectors.xpath)) {
      // Use CSS selectors by default, fallback to XPath
      const categorySelectors = selectors.css || selectors.xpath;

      // Update the selector type based on what was generated
      const newSelectorType = selectors.css ? "css" : "xpath";

      // If we have selectors for the current categories, use them
      const currentCategory = config.categories[0] || "Services";
      const newSelector =
        categorySelectors[currentCategory] ||
        categorySelectors[Object.keys(categorySelectors)[0]] ||
        "";

      setConfig({
        ...config,
        selectorType: newSelectorType as "css" | "xpath" | "auto",
        selector: newSelector,
      });

      setSavedMessage("Selectors applied successfully");
    }

    setShowVisualBuilder(false);
  };

  // Validate URL format
  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  return (
    <div className="flex flex-col h-full w-full p-4 border rounded-lg bg-background shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Scraping Configuration</h2>
        <div className="flex space-x-2">
          <Dialog open={showSavedConfigs} onOpenChange={setShowSavedConfigs}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Saved Configs
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Saved Configurations</DialogTitle>
              </DialogHeader>
              <div className="flex-grow overflow-auto">
                <SavedConfigsList onLoadConfig={handleLoadConfig} />
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportConfig}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("import-config")?.click()}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <input
              id="import-config"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportConfig}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveConfiguration}
            disabled={isLoading || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSaving ? "Saving..." : "Save"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfig(defaultConfig)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Configuration Name"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            className="max-w-md"
          />
          <HelpTooltip content="Give your configuration a descriptive name to easily identify it later" />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {savedMessage && (
        <Alert
          variant="success"
          className="mb-4 bg-green-50 text-green-800 border-green-200"
        >
          <AlertDescription>{savedMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4 w-full">
          <TabsTrigger value="basic">
            <Globe className="h-4 w-4 mr-2" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="schedule" disabled={config.mode !== "scheduled"}>
            <Clock className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="queue">
            <RefreshCw className="h-4 w-4 mr-2" />
            Queue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {config.mode === "multiple" ? "Target URLs" : "Target URL"}
            </label>

            {config.mode === "multiple" ? (
              <div className="space-y-2">
                {(config.urls || []).map((url, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...(config.urls || [])];
                        newUrls[index] = e.target.value;
                        setConfig({ ...config, urls: newUrls });
                      }}
                      className={
                        error && !isValidUrl(url) ? "border-red-500" : ""
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newUrls = [...(config.urls || [])];
                        newUrls.splice(index, 1);
                        setConfig({ ...config, urls: newUrls });
                      }}
                      disabled={config.urls?.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newUrls = [...(config.urls || []), ""];
                    setConfig({ ...config, urls: newUrls });
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add URL
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://example.com"
                  value={config.url}
                  onChange={handleUrlChange}
                  className={
                    error && !isValidUrl(config.url) ? "border-red-500" : ""
                  }
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <label className="text-sm font-medium">Scraping Mode</label>
              <HelpTooltip content="Choose how you want to scrape content: from a single URL, multiple URLs, or on a schedule" />
            </div>
            <Select
              value={config.mode}
              onValueChange={(value: any) => handleModeChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single URL</SelectItem>
                <SelectItem value="multiple">Multiple URLs</SelectItem>
                <SelectItem value="scheduled">Scheduled Scraping</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <label className="text-sm font-medium">Extraction Depth</label>
              <HelpTooltip content="Basic: Fast, surface-level extraction. Thorough: Deeper extraction with structure. Semantic: AI-powered content understanding" />
            </div>
            <Select
              value={config.scrapingMode}
              onValueChange={(value: any) => {
                setConfig({ ...config, scrapingMode: value });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select extraction depth" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">
                  Basic (Fast, surface-level extraction)
                </SelectItem>
                <SelectItem value="thorough">
                  Thorough (Deeper extraction with structure)
                </SelectItem>
                <SelectItem value="semantic">
                  Semantic (AI-powered content understanding)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <label className="text-sm font-medium">Output Format</label>
              <HelpTooltip content="Choose how the scraped data should be formatted: JSON, HTML, plain text, or structured data" />
            </div>
            <Select
              value={config.outputFormat}
              onValueChange={(value: any) => handleOutputFormatChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select output format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center">
                    <FileJson className="h-4 w-4 mr-2" />
                    JSON
                  </div>
                </SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="text">Cleaned Text</SelectItem>
                <SelectItem value="structured">Structured Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <label className="text-sm font-medium">
                Categories to Extract
              </label>
              <HelpTooltip content="Select which types of information you want to extract and categorize from the website" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Services", "Fees", "Documents", "Eligibility"].map(
                (category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={config.categories.includes(category)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setConfig({
                            ...config,
                            categories: [...config.categories, category],
                          });
                        } else {
                          setConfig({
                            ...config,
                            categories: config.categories.filter(
                              (c) => c !== category,
                            ),
                          });
                        }
                      }}
                    />
                    <label
                      htmlFor={`category-${category}`}
                      className="text-sm cursor-pointer"
                    >
                      {category}
                    </label>
                  </div>
                ),
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="text-sm font-medium">Selector Type</label>
              <HelpTooltip content="CSS: Use CSS selectors to target elements. XPath: Use XPath expressions for more complex targeting. Auto-detect: Let AI determine the best selectors" />
            </div>
            <Select
              value={config.selectorType}
              onValueChange={(value: any) => handleSelectorTypeChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select selector type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="css">CSS Selector</SelectItem>
                <SelectItem value="xpath">XPath</SelectItem>
                <SelectItem value="auto">Auto-detect (AI)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <label className="text-sm font-medium">Custom Selector</label>
              <HelpTooltip content="Enter a custom selector to target specific elements on the page. For CSS, use '.class' or '#id'. For XPath, use expressions like '//div[@class='content']'" />
            </div>
            <div className="flex items-center space-x-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  config.selectorType === "css"
                    ? ".content-area"
                    : '//div[@class="content"]'
                }
                value={config.selector}
                onChange={handleSelectorChange}
                disabled={config.selectorType === "auto"}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVisualBuilder(true)}
                disabled={!isValidUrl(config.url)}
                title={!isValidUrl(config.url) ? "Enter a valid URL first" : ""}
              >
                <MousePointer className="mr-2 h-4 w-4" />
                Visual
              </Button>
            </div>
            {config.selectorType === "auto" && (
              <p className="text-xs text-muted-foreground">
                AI will automatically detect the best selectors for each
                category.
              </p>
            )}

            <Dialog
              open={showVisualBuilder}
              onOpenChange={setShowVisualBuilder}
            >
              <DialogContent className="max-w-[90vw] max-h-[90vh] w-[90vw] h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Visual Selector Builder</DialogTitle>
                  <DialogDescription>
                    Click on elements in the page to select them and generate
                    selectors
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                  <VisualSelectorBuilder
                    url={config.url}
                    onSave={handleVisualSelectorSave}
                    onClose={() => setShowVisualBuilder(false)}
                    initialCategories={config.categories}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <label className="text-sm font-medium">Advanced Options</label>
              <HelpTooltip content="Configure detailed settings to customize the scraping behavior" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  Handle Dynamic Content (JavaScript)
                </span>
              </div>
              <Switch
                checked={config.options.handleDynamicContent}
                onCheckedChange={(checked) =>
                  handleOptionChange("handleDynamicContent", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Follow Pagination</span>
              </div>
              <Switch
                checked={config.options.followPagination}
                onCheckedChange={(checked) =>
                  handleOptionChange("followPagination", checked)
                }
              />
            </div>

            {config.options.followPagination && (
              <div className="space-y-2 pl-6">
                <label className="text-sm font-medium">
                  Max Pages to Scrape
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={config.options.maxPages}
                  onChange={(e) =>
                    handleOptionChange(
                      "maxPages",
                      parseInt(e.target.value) || 1,
                    )
                  }
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Skip Headers & Footers</span>
              </div>
              <Switch
                checked={config.options.skipHeadersFooters}
                onCheckedChange={(checked) =>
                  handleOptionChange("skipHeadersFooters", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Skip Images & Media</span>
              </div>
              <Switch
                checked={config.options.skipImagesMedia}
                onCheckedChange={(checked) =>
                  handleOptionChange("skipImagesMedia", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Extract Images</span>
              </div>
              <Switch
                checked={config.options.extractImages}
                onCheckedChange={(checked) =>
                  handleOptionChange("extractImages", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Deduplicate Results</span>
              </div>
              <Switch
                checked={config.options.deduplicateResults}
                onCheckedChange={(checked) =>
                  handleOptionChange("deduplicateResults", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Stealth Mode</span>
                <span className="text-xs text-muted-foreground">
                  (Avoid detection)
                </span>
              </div>
              <Switch
                checked={config.options.stealthMode}
                onCheckedChange={(checked) =>
                  handleOptionChange("stealthMode", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Respect robots.txt</span>
              </div>
              <Switch
                checked={config.options.respectRobotsTxt}
                onCheckedChange={(checked) =>
                  handleOptionChange("respectRobotsTxt", checked)
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Rate Limit Delay (ms)
              </label>
              <Input
                type="number"
                min={0}
                max={10000}
                step={100}
                value={config.options.rateLimitDelay}
                onChange={(e) =>
                  handleOptionChange(
                    "rateLimitDelay",
                    parseInt(e.target.value) || 0,
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Delay between requests to avoid rate limiting (0-10000ms)
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Schedule Enabled</label>
              <Switch
                checked={config.schedule?.enabled !== false}
                onCheckedChange={(checked) => {
                  setConfig({
                    ...config,
                    schedule: {
                      ...config.schedule,
                      enabled: checked,
                    },
                  });
                }}
              />
            </div>
            <label className="text-sm font-medium">Frequency</label>
            <Select
              value={config.schedule?.frequency || "daily"}
              onValueChange={(value: "daily" | "weekly" | "monthly") => {
                setConfig({
                  ...config,
                  schedule: {
                    ...config.schedule,
                    frequency: value,
                  },
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Time</label>
            <Input
              type="time"
              value="12:00"
              value={config.schedule?.time || "12:00"}
              onChange={(e) => {
                setConfig({
                  ...config,
                  schedule: {
                    ...config.schedule,
                    time: e.target.value,
                  },
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Timezone</label>
            <Select
              value={config.schedule?.timezone || "UTC"}
              onValueChange={(value: string) => {
                setConfig({
                  ...config,
                  schedule: {
                    ...config.schedule,
                    timezone: value,
                  },
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">
                  Eastern Time (ET)
                </SelectItem>
                <SelectItem value="America/Chicago">
                  Central Time (CT)
                </SelectItem>
                <SelectItem value="America/Denver">
                  Mountain Time (MT)
                </SelectItem>
                <SelectItem value="America/Los_Angeles">
                  Pacific Time (PT)
                </SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.schedule?.frequency === "weekly" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Days of Week</label>
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day, index) => (
                    <div key={day} className="flex flex-col items-center">
                      <Checkbox
                        id={`day-${index}`}
                        checked={
                          config.schedule?.daysOfWeek?.includes(index) || false
                        }
                        onCheckedChange={(checked) => {
                          const currentDays = config.schedule?.daysOfWeek || [];
                          const newDays = checked
                            ? [...currentDays, index].sort((a, b) => a - b)
                            : currentDays.filter((d) => d !== index);

                          setConfig({
                            ...config,
                            schedule: {
                              ...config.schedule,
                              daysOfWeek: newDays,
                            },
                          });
                        }}
                      />
                      <label htmlFor={`day-${index}`} className="text-xs mt-1">
                        {day}
                      </label>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {config.schedule?.frequency === "monthly" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={
                  config.schedule?.startDate ||
                  new Date().toISOString().split("T")[0]
                }
                onChange={(e) => {
                  setConfig({
                    ...config,
                    schedule: {
                      ...config.schedule,
                      startDate: e.target.value,
                    },
                  });
                }}
              />
              <p className="text-xs text-muted-foreground">
                The scraping will run monthly on day{" "}
                {config.schedule?.startDate
                  ? new Date(config.schedule.startDate).getDate()
                  : new Date().getDate()}
              </p>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-2">Schedule Summary</h3>
            <p className="text-sm text-muted-foreground">
              Scraping will run {config.schedule?.frequency || "daily"}
              {config.schedule?.frequency === "weekly" &&
                config.schedule?.daysOfWeek?.length > 0 && (
                  <>
                    {" "}
                    on{" "}
                    {config.schedule.daysOfWeek
                      .map(
                        (d) =>
                          ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d],
                      )
                      .join(", ")}
                  </>
                )}
              {config.schedule?.frequency === "monthly" && (
                <>
                  {" "}
                  on day{" "}
                  {config.schedule?.startDate
                    ? new Date(config.schedule.startDate).getDate()
                    : new Date().getDate()}
                </>
              )}
              {" at "}
              {config.schedule?.time || "12:00"}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Priority</label>
            <Select
              value={config.priority || "medium"}
              onValueChange={(value: any) => {
                setConfig({
                  ...config,
                  priority: value,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Max Retries</label>
            <Input
              type="number"
              min={0}
              max={10}
              value={config.maxRetries || 3}
              onChange={(e) => {
                setConfig({
                  ...config,
                  maxRetries: parseInt(e.target.value) || 0,
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Number of times to retry on failure (0-10)
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-2">Queue Management</h3>
            <p className="text-sm text-muted-foreground">
              Jobs are processed based on priority. Higher priority jobs are
              processed first. Failed jobs will be retried automatically up to
              the maximum retry count.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-auto pt-4">
        <Button
          className="w-full"
          onClick={handleStartScraping}
          disabled={isLoading || !isValidUrl(config.url)}
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <List className="h-4 w-4 mr-2" />
              Start Scraping
            </>
          )}
        </Button>
        {isLoading && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            Please wait while we scrape the website. Results will appear
            automatically when complete.
          </p>
        )}
      </div>
    </div>
  );
};

export default ScrapingConfigPanel;
