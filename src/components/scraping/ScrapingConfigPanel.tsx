"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Zap,
  Layers,
  Code,
  Bot,
  Sparkles,
  Braces,
  Workflow,
  Cpu,
  Database,
  Filter,
  Search,
  Tag,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle,
  Info,
  HelpCircle,
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
  DialogFooter,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
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
    proxyUrl: "https://corsproxy.io/?url=",
    useAI: false,
    aiConfidenceThreshold: 0.7,
    extractMetadata: true,
    followLinks: false,
    maxLinkDepth: 1,
    timeout: 30000,
    retryDelay: 2000,
  },
  outputFormat: "json",
  priority: "medium",
  maxRetries: 3,
  tags: [],
  customEntities: [],
};

// Available categories for extraction
const availableCategories = [
  "Services",
  "Fees",
  "Documents",
  "Eligibility",
  "Products",
  "Pricing",
  "FAQ",
  "Contact",
  "About",
  "Testimonials",
  "Team",
  "Events",
  "News",
  "Blog",
  "Legal",
  "Privacy",
  "Terms",
  "Support",
  "Technical",
];

// Available proxy services
const proxyServices = [
  { name: "corsproxy.io", url: "https://corsproxy.io/?url=" },
  { name: "allorigins.win", url: "https://api.allorigins.win/raw?url=" },
  { name: "cors-anywhere", url: "https://cors-anywhere.herokuapp.com/" },
  { name: "thingproxy", url: "https://thingproxy.freeboard.io/fetch/" },
  { name: "corsanywhere", url: "https://corsanywhere.herokuapp.com/" },
];

// Available timezones
const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
];

// LLM formatting options
const llmFormattingOptions = [
  { id: "json", name: "JSON", description: "Structured data in JSON format", icon: Braces },
  { id: "markdown", name: "Markdown", description: "Formatted text with Markdown syntax", icon: FileText },
  { id: "text", name: "Plain Text", description: "Simple text without formatting", icon: FileText },
  { id: "gemini", name: "Gemini AI", description: "Optimized for Gemini AI models", icon: Sparkles },
  { id: "grok", name: "Grok", description: "Optimized for Grok AI models", icon: Zap },
  { id: "openai", name: "OpenAI", description: "Optimized for OpenAI models", icon: Bot },
];

const ScrapingConfigPanel: React.FC<ScrapingConfigPanelProps> = ({
  onStartScraping = () => {},
  isLoading = false,
}) => {
  // State management
  const [config, setConfig] = useState<ScrapingConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState("basic");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showSavedConfigs, setShowSavedConfigs] = useState(false);
  const [showVisualBuilder, setShowVisualBuilder] = useState(false);
  const [configName, setConfigName] = useState("");
  const [showAdvancedAI, setShowAdvancedAI] = useState(false);
  const [showLLMFormatting, setShowLLMFormatting] = useState(false);
  const [selectedLLMFormat, setSelectedLLMFormat] = useState("json");
  const [customCategory, setCustomCategory] = useState("");
  const [customEntity, setCustomEntity] = useState({ name: "", category: "", description: "" });
  const [showCustomEntityDialog, setShowCustomEntityDialog] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string | number }>({ type: "", id: "" });
  const [configTags, setConfigTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [configNotes, setConfigNotes] = useState("");
  
  // Derived state
  const isValidConfig = useMemo(() => {
    // Basic validation
    if (config.mode === "single" && !isValidUrl(config.url)) return false;
    if (config.mode === "multiple" && (!config.urls || config.urls.some(url => !isValidUrl(url)))) return false;
    if (config.categories.length === 0) return false;
    
    // Advanced validation
    if (config.selectorType !== "auto" && !config.selector) return false;
    
    return true;
  }, [config]);

  // Validate URL when it changes
  useEffect(() => {
    validateConfig();
  }, [config]);

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
          timezone: "UTC",
          enabled: true,
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

  // Comprehensive config validation
  const validateConfig = () => {
    const errors: Record<string, string> = {};
    const warningMessages: string[] = [];
    
    // URL validation
    if (config.mode === "single") {
      if (!config.url) {
        errors["url"] = "URL is required";
      } else if (!isValidUrl(config.url)) {
        errors["url"] = "Please enter a valid URL including http:// or https://";
      }
    } else if (config.mode === "multiple") {
      if (!config.urls || config.urls.length === 0) {
        errors["urls"] = "At least one URL is required";
      } else {
        const invalidUrls = config.urls.filter(url => !isValidUrl(url));
        if (invalidUrls.length > 0) {
          errors["urls"] = `${invalidUrls.length} invalid URL(s) detected`;
        }
      }
    }
    
    // Categories validation
    if (config.categories.length === 0) {
      errors["categories"] = "At least one category must be selected";
    }
    
    // Selector validation
    if (config.selectorType !== "auto" && !config.selector) {
      errors["selector"] = "Selector is required unless using Auto-detect";
    }
    
    // Pagination validation
    if (config.options.followPagination && (config.options.maxPages < 1 || config.options.maxPages > 100)) {
      errors["maxPages"] = "Max pages must be between 1 and 100";
    }
    
    // Schedule validation
    if (config.mode === "scheduled") {
      if (!config.schedule?.time) {
        errors["scheduleTime"] = "Schedule time is required";
      }
      if (config.schedule?.frequency === "weekly" && (!config.schedule.daysOfWeek || config.schedule.daysOfWeek.length === 0)) {
        errors["scheduleDays"] = "At least one day of the week must be selected";
      }
    }
    
    // Performance warnings
    if (config.options.handleDynamicContent && config.options.followPagination && config.options.maxPages > 10) {
      warningMessages.push("Scraping many pages with dynamic content may take a long time");
    }
    
    if (config.options.rateLimitDelay < 500 && !config.options.stealthMode) {
      warningMessages.push("Low rate limit delay without stealth mode may trigger website blocking");
    }
    
    if (config.scrapingMode === "semantic" && !config.options.useAI) {
      warningMessages.push("Semantic mode works best with AI processing enabled");
    }
    
    setValidationErrors(errors);
    setWarnings(warningMessages);
    
    return Object.keys(errors).length === 0;
  };

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Handler functions
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
    value: boolean | number | string,
  ) => {
    setConfig({
      ...config,
      options: {
        ...config.options,
        [option]: value,
      },
    });
  };

  const handleAddCategory = () => {
    if (customCategory && !config.categories.includes(customCategory)) {
      setConfig({
        ...config,
        categories: [...config.categories, customCategory],
      });
      setCustomCategory("");
    }
  };

  const handleAddTag = () => {
    if (newTag && !configTags.includes(newTag)) {
      const updatedTags = [...configTags, newTag];
      setConfigTags(updatedTags);
      setConfig({
        ...config,
        tags: updatedTags,
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    const updatedTags = configTags.filter(t => t !== tag);
    setConfigTags(updatedTags);
    setConfig({
      ...config,
      tags: updatedTags,
    });
  };

  const handleAddCustomEntity = () => {
    if (customEntity.name && customEntity.category) {
      const newEntity = {
        ...customEntity,
        id: `entity_${Date.now()}`,
      };
      
      setConfig({
        ...config,
        customEntities: [...(config.customEntities || []), newEntity],
      });
      
      setCustomEntity({ name: "", category: "", description: "" });
      setShowCustomEntityDialog(false);
    }
  };

  const handleRemoveCustomEntity = (entityId: string) => {
    setItemToDelete({ type: "entity", id: entityId });
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    if (itemToDelete.type === "entity") {
      setConfig({
        ...config,
        customEntities: (config.customEntities || []).filter(entity => entity.id !== itemToDelete.id),
      });
    } else if (itemToDelete.type === "url" && typeof itemToDelete.id === "number") {
      const newUrls = [...(config.urls || [])];
      newUrls.splice(itemToDelete.id as number, 1);
      setConfig({ ...config, urls: newUrls });
    }
    
    setShowDeleteConfirmation(false);
    setItemToDelete({ type: "", id: "" });
  };

  const handleStartScraping = async () => {
    // Validate configuration before starting
    if (!validateConfig()) {
      setShowValidationSummary(true);
      return;
    }

    try {
      // Call the parent component's onStartScraping function
      onStartScraping(config);

      // Also perform the actual scraping using our API service
      try {
        const result = await performScraping(config);
        console.log("Scraping result:", result);

        // Check if the result is a queued job
        if (result.status === "queued") {
          // Show a message about the queued job
          setSavedMessage(
            `Job added to queue with ID: ${result.jobId}. Check the Queue tab for status.`,
          );
        }
      } catch (apiError: any) {
        console.error("API error during scraping, but continuing:", apiError);
        setSavedMessage(
          `Scraping completed with issues: ${apiError.message || "Unknown error"}. Results may be partial.`,
        );
      }

      // The result will be handled by the parent component through the onStartScraping callback
    } catch (error: any) {
      console.error("Error starting scraping:", error);
      setError(error.message || "Failed to start scraping operation");
    }
  };

  const handleSaveConfiguration = async () => {
    if (!validateConfig()) {
      setShowValidationSummary(true);
      return;
    }

    try {
      setIsSaving(true);
      // Add name and notes to config if provided
      const configToSave = {
        ...config,
        name: configName || `Config ${new Date().toLocaleString()}`,
        notes: configNotes || undefined,
      };

      try {
        const savedConfig = await saveScrapingConfiguration(configToSave);
        console.log("Saved configuration:", savedConfig);
        setSavedMessage("Configuration saved successfully");

        // Update the current config with the saved one
        setConfig(savedConfig);
      } catch (apiError: any) {
        console.error(
          "API error saving configuration, using local fallback:",
          apiError,
        );
        // Generate a fake ID if needed
        if (!configToSave.id) {
          configToSave.id = `config_${Date.now()}`;
        }
        // Set timestamps
        configToSave.createdAt =
          configToSave.createdAt || new Date().toISOString();
        configToSave.updatedAt = new Date().toISOString();

        setSavedMessage(`Configuration saved locally. Error: ${apiError.message || "Unknown error"}.`);
        setConfig(configToSave);
      }
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
    setConfigNotes(loadedConfig.notes || "");
    setConfigTags(loadedConfig.tags || []);
    setShowSavedConfigs(false);
    setSavedMessage("Configuration loaded successfully");
  };

  const handleExportConfig = () => {
    try {
      const configToExport = {
        ...config,
        name: configName || `Config ${new Date().toLocaleString()}`,
        notes: configNotes || undefined,
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
        setConfigNotes(importedConfig.notes || "");
        setConfigTags(importedConfig.tags || []);
        setSavedMessage("Configuration imported successfully");
      } catch (error: any) {
        console.error("Error parsing imported configuration:", error);
        setError("Invalid configuration file: " + (error.message || "Unknown error"));
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

  const handleLLMFormatChange = (formatId: string) => {
    setSelectedLLMFormat(formatId);
    
    // Update config based on selected LLM format
    let updatedConfig = { ...config };
    
    // Set appropriate options based on the selected format
    if (formatId === "gemini" || formatId === "grok" || formatId === "openai") {
      updatedConfig.options.useAI = true;
      updatedConfig.scrapingMode = "semantic";
      updatedConfig.outputFormat = "structured";
      
      // Add specific metadata for the AI model
      updatedConfig.metadata = {
        ...updatedConfig.metadata,
        llmFormat: formatId,
        llmOptimized: true,
      };
    } else {
      // For non-AI formats, update output format accordingly
      updatedConfig.outputFormat = formatId === "markdown" ? "text" : formatId as any;
      
      // Update metadata
      updatedConfig.metadata = {
        ...updatedConfig.metadata,
        llmFormat: formatId,
        llmOptimized: false,
      };
    }
    
    setConfig(updatedConfig);
    setShowLLMFormatting(false);
    setSavedMessage(`Output format optimized for ${formatId === "json" ? "JSON" : formatId === "markdown" ? "Markdown" : formatId.toUpperCase()}`);
  };

  return (
    <div className="flex flex-col h-full w-full p-4 border rounded-lg bg-background shadow-sm">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold">Scraping Configuration</h2>
          <p className="text-sm text-muted-foreground">Configure and manage your web scraping operations</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
                <DialogDescription>
                  Load a previously saved configuration to continue working with it
                </DialogDescription>
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
          
          <Dialog open={showLLMFormatting} onOpenChange={setShowLLMFormatting}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                LLM Format
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>LLM Formatting Options</DialogTitle>
                <DialogDescription>
                  Optimize the scraped data for use with Large Language Models
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {llmFormattingOptions.map((format) => (
                  <Card 
                    key={format.id} 
                    className={`cursor-pointer transition-all ${selectedLLMFormat === format.id ? 'border-primary' : 'hover:border-primary/50'}`}
                    onClick={() => handleLLMFormatChange(format.id)}
                  >
                    <CardHeader className="flex flex-row items-center gap-2 py-3">
                      <format.icon className="h-5 w-5" />
                      <div>
                        <CardTitle className="text-base">{format.name}</CardTitle>
                      </div>
                      {selectedLLMFormat === format.id && (
                        <CheckCircle2 className="h-5 w-5 ml-auto text-primary" />
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <p className="text-sm text-muted-foreground">{format.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Configuration name and description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="config-name">Configuration Name</Label>
          <Input
            id="config-name"
            placeholder="My Scraping Configuration"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="config-tags">Tags</Label>
            {configTags.length > 0 && (
              <span className="text-xs text-muted-foreground">{configTags.length} tag(s)</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Input
              id="config-tags"
              placeholder="Add tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button type="button" size="sm" onClick={handleAddTag} disabled={!newTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {configTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {configTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="config-notes">Notes</Label>
          <span className="text-xs text-muted-foreground">{configNotes.length} / 500</span>
        </div>
        <Textarea
          id="config-notes"
          placeholder="Add notes about this configuration..."
          value={configNotes}
          onChange={(e) => setConfigNotes(e.target.value)}
          maxLength={500}
          className="mt-2 resize-none h-20"
        />
      </div>

      {/* Error and success messages */}
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
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{savedMessage}</AlertDescription>
        </Alert>
      )}
      
      {warnings.length > 0 && (
        <Alert variant="warning" className="mb-4 bg-yellow-50 text-yellow-800 border-yellow-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Validation summary dialog */}
      <Dialog open={showValidationSummary} onOpenChange={setShowValidationSummary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuration Validation</DialogTitle>
            <DialogDescription>
              Please fix the following issues before proceeding:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="list-disc pl-5 space-y-2">
              {Object.entries(validationErrors).map(([key, message]) => (
                <li key={key} className="text-destructive">
                  {message}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowValidationSummary(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main configuration tabs */}
      <div className="flex-1 overflow-y-auto pr-2 mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4 w-full">
            <TabsTrigger value="basic">
              <Globe className="h-4 w-4 mr-2" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings className="h-4 w-4 mr-2" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Options
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              disabled={config.mode !== "scheduled"}
            >
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="queue">
              <RefreshCw className="h-4 w-4 mr-2" />
              Queue
            </TabsTrigger>
          </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-6">
                {/* URL Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">URL Configuration</h3>
                    <HelpTooltip content="Configure the target URLs for scraping" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="scraping-mode">Scraping Mode</Label>
                      <Select
                        value={config.mode}
                        onValueChange={(value: any) => handleModeChange(value)}
                      >
                        <SelectTrigger id="scraping-mode">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              Single URL
                            </div>
                          </SelectItem>
                          <SelectItem value="multiple">
                            <div className="flex items-center">
                              <Layers className="h-4 w-4 mr-2" />
                              Multiple URLs
                            </div>
                          </SelectItem>
                          <SelectItem value="scheduled">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              Scheduled Scraping
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="target-url">
                        {config.mode === "multiple" ? "Target URLs" : "Target URL"}
                      </Label>

                      {config.mode === "multiple" ? (
                        <div className="space-y-2">
                          {(config.urls || []).map((url, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <Input
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => {
                                  const newUrls = [...(config.urls || [])];
                                  newUrls[index] = e.target.value;
                                  setConfig({ ...config, urls: newUrls });
                                }}
                                className={validationErrors["urls"] ? "border-red-500" : ""}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setItemToDelete({ type: "url", id: index });
                                  setShowDeleteConfirmation(true);
                                }}
                                disabled={config.urls?.length === 1}
                                className="flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          ))}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setConfig({
                                ...config,
                                urls: [...(config.urls || []), ""],
                              });
                            }}
                            className="mt-2"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add URL
                          </Button>
                        </div>
                      ) : (
                        <Input
                          id="target-url"
                          placeholder="https://example.com"
                          value={config.url}
                          onChange={handleUrlChange}
                          className={validationErrors["url"] ? "border-red-500" : ""}
                        />
                      )}
                      
                      {validationErrors["url"] && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors["url"]}</p>
                      )}
                      {validationErrors["urls"] && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors["urls"]}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Selector Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">Selector Configuration</h3>
                    <HelpTooltip content="Configure how content is selected from the target URLs" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="selector-type">Selector Type</Label>
                      <Select
                        value={config.selectorType}
                        onValueChange={(value: any) => handleSelectorTypeChange(value)}
                      >
                        <SelectTrigger id="selector-type">
                          <SelectValue placeholder="Select selector type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="css">
                            <div className="flex items-center">
                              <Code className="h-4 w-4 mr-2" />
                              CSS Selector
                            </div>
                          </SelectItem>
                          <SelectItem value="xpath">
                            <div className="flex items-center">
                              <Code className="h-4 w-4 mr-2" />
                              XPath
                            </div>
                          </SelectItem>
                          <SelectItem value="auto">
                            <div className="flex items-center">
                              <Sparkles className="h-4 w-4 mr-2" />
                              Auto-detect
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {config.selectorType !== "auto" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="selector">Selector</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowVisualBuilder(true)}
                            className="text-xs"
                          >
                            <MousePointer className="h-3 w-3 mr-1" />
                            Visual Builder
                          </Button>
                        </div>
                        <Input
                          id="selector"
                          placeholder={config.selectorType === "css" ? ".content-class" : "//div[@class='content']"}
                          value={config.selector}
                          onChange={handleSelectorChange}
                          className={validationErrors["selector"] ? "border-red-500" : ""}
                        />
                        {validationErrors["selector"] && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors["selector"]}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Categories */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">Categories</h3>
                    <HelpTooltip content="Select categories to extract from the content" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {availableCategories.map((category) => (
                        <Badge
                          key={category}
                          variant={config.categories.includes(category) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (config.categories.includes(category)) {
                              setConfig({
                                ...config,
                                categories: config.categories.filter((c) => c !== category),
                              });
                            } else {
                              setConfig({
                                ...config,
                                categories: [...config.categories, category],
                              });
                            }
                          }}
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Custom category"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCategory}
                        disabled={!customCategory}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {validationErrors["categories"] && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors["categories"]}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right column */}
              <div className="space-y-6">
                {/* Scraping Mode */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">Scraping Mode</h3>
                    <HelpTooltip content="Configure the depth and approach of the scraping operation" />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <RadioGroup
                      value={config.scrapingMode}
                      onValueChange={(value: any) => setConfig({ ...config, scrapingMode: value })}
                      className="grid grid-cols-1 md:grid-cols-3 gap-2"
                    >
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="basic" id="scraping-mode-basic" />
                        <div className="grid gap-1">
                          <Label htmlFor="scraping-mode-basic" className="font-medium">Basic</Label>
                          <p className="text-xs text-muted-foreground">Simple content extraction with minimal processing</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="thorough" id="scraping-mode-thorough" />
                        <div className="grid gap-1">
                          <Label htmlFor="scraping-mode-thorough" className="font-medium">Thorough</Label>
                          <p className="text-xs text-muted-foreground">Detailed extraction with advanced filtering</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="semantic" id="scraping-mode-semantic" />
                        <div className="grid gap-1">
                          <Label htmlFor="scraping-mode-semantic" className="font-medium">Semantic</Label>
                          <p className="text-xs text-muted-foreground">AI-powered extraction with context understanding</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                
                {/* Output Format */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">Output Format</h3>
                    <HelpTooltip content="Configure how the scraped data should be formatted" />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      variant={config.outputFormat === "json" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleOutputFormatChange("json")}
                      className="justify-start"
                    >
                      <Braces className="h-4 w-4 mr-2" />
                      JSON
                    </Button>
                    
                    <Button
                      variant={config.outputFormat === "html" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleOutputFormatChange("html")}
                      className="justify-start"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      HTML
                    </Button>
                    
                    <Button
                      variant={config.outputFormat === "text" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleOutputFormatChange("text")}
                      className="justify-start"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Text
                    </Button>
                    
                    <Button
                      variant={config.outputFormat === "structured" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleOutputFormatChange("structured")}
                      className="justify-start"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Structured
                    </Button>
                  </div>
                </div>
                
                {/* Basic Options */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">Basic Options</h3>
                    <HelpTooltip content="Configure basic scraping behavior" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="handle-dynamic-content"
                          checked={config.options.handleDynamicContent}
                          onCheckedChange={(checked) => handleOptionChange("handleDynamicContent", Boolean(checked))}
                        />
                        <Label htmlFor="handle-dynamic-content">Handle Dynamic Content</Label>
                      </div>
                      <HelpTooltip content="Process JavaScript-rendered content" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="follow-pagination"
                          checked={config.options.followPagination}
                          onCheckedChange={(checked) => handleOptionChange("followPagination", Boolean(checked))}
                        />
                        <Label htmlFor="follow-pagination">Follow Pagination</Label>
                      </div>
                      <HelpTooltip content="Automatically navigate through paginated content" />
                    </div>
                    
                    {config.options.followPagination && (
                      <div className="pl-6 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="max-pages">Maximum Pages</Label>
                          <span className="text-sm text-muted-foreground">{config.options.maxPages}</span>
                        </div>
                        <Slider
                          id="max-pages"
                          min={1}
                          max={100}
                          step={1}
                          value={[config.options.maxPages]}
                          onValueChange={(value) => handleOptionChange("maxPages", value[0])}
                          className={validationErrors["maxPages"] ? "border-red-500" : ""}
                        />
                        {validationErrors["maxPages"] && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors["maxPages"]}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="extract-images"
                          checked={config.options.extractImages}
                          onCheckedChange={(checked) => handleOptionChange("extractImages", Boolean(checked))}
                        />
                        <Label htmlFor="extract-images">Extract Images</Label>
                      </div>
                      <HelpTooltip content="Include images in the extraction results" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="deduplicate-results"
                          checked={config.options.deduplicateResults}
                          onCheckedChange={(checked) => handleOptionChange("deduplicateResults", Boolean(checked))}
                        />
                        <Label htmlFor="deduplicate-results">Deduplicate Results</Label>
                      </div>
                      <HelpTooltip content="Remove duplicate content from results" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            {/* Advanced options content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-6">
                {/* Performance Options */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">Performance Options</h3>
                    <HelpTooltip content="Configure performance-related settings" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="rate-limit-delay">Rate Limit Delay (ms)</Label>
                        <span className="text-sm text-muted-foreground">{config.options.rateLimitDelay}ms</span>
                      </div>
                      <Slider
                        id="rate-limit-delay"
                        min={0}
                        max={5000}
                        step={100}
                        value={[config.options.rateLimitDelay]}
                        onValueChange={(value) => handleOptionChange("rateLimitDelay", value[0])}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="timeout">Request Timeout (ms)</Label>
                        <span className="text-sm text-muted-foreground">{config.options.timeout}ms</span>
                      </div>
                      <Slider
                        id="timeout"
                        min={1000}
                        max={60000}
                        step={1000}
                        value={[config.options.timeout || 30000]}
                        onValueChange={(value) => handleOptionChange("timeout", value[0])}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="retry-delay">Retry Delay (ms)</Label>
                        <span className="text-sm text-muted-foreground">{config.options.retryDelay}ms</span>
                      </div>
                      <Slider
                        id="retry-delay"
                        min={500}
                        max={10000}
                        step={500}
                        value={[config.options.retryDelay || 2000]}
                        onValueChange={(value) => handleOptionChange("retryDelay", value[0])}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="max-retries">Maximum Retries</Label>
                      <Select
                        value={String(config.maxRetries || 3)}
                        onValueChange={(value) => setConfig({ ...config, maxRetries: parseInt(value) })}
                      >
                        <SelectTrigger id="max-retries">
                          <SelectValue placeholder="Select max retries" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 5, 10].map((value) => (
                            <SelectItem key={value} value={String(value)}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                {/* Content Filtering */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">Content Filtering</h3>
                    <HelpTooltip content="Configure content filtering options" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="skip-headers-footers"
                          checked={config.options.skipHeadersFooters}
                          onCheckedChange={(checked) => handleOptionChange("skipHeadersFooters", Boolean(checked))}
                        />
                        <Label htmlFor="skip-headers-footers">Skip Headers & Footers</Label>
                      </div>
                      <HelpTooltip content="Exclude common header and footer content" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="skip-images-media"
                          checked={config.options.skipImagesMedia}
                          onCheckedChange={(checked) => handleOptionChange("skipImagesMedia", Boolean(checked))}
                        />
                        <Label htmlFor="skip-images-media">Skip Images & Media</Label>
                      </div>
                      <HelpTooltip content="Exclude images and media content" />
                    </div>
                  </div>
                </div>
                
                {/* Custom Entities */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium">Custom Entities</h3>
                      <HelpTooltip content="Define custom entities to extract" />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomEntityDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Entity
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {(config.customEntities || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No custom entities defined</p>
                    ) : (
                      <div className="space-y-2">
                        {(config.customEntities || []).map((entity, index) => (
                          <div key={entity.id || index} className="flex items-center justify-between p-2 border rounded-md">
                            <div>
                              <p className="font-medium">{entity.name}</p>
                              <p className="text-xs text-muted-foreground">Category: {entity.category}</p>
                              {entity.description && (
                                <p className="text-xs text-muted-foreground">{entity.description}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCustomEntity(entity.id || String(index))}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right column */}
              <div className="space-y-6">
                {/* Privacy & Security */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">Privacy & Security</h3>
                    <HelpTooltip content="Configure privacy and security settings" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="stealth-mode"
                          checked={config.options.stealthMode}
                          onCheckedChange={(checked) => handleOptionChange("stealthMode", Boolean(checked))}
                        />
                        <Label htmlFor="stealth-mode">Stealth Mode</Label>
                      </div>
                      <HelpTooltip content="Hide scraping activity from target websites" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="respect-robots"
                          checked={config.options.respectRobotsTxt}
                          onCheckedChange={(checked) => handleOptionChange("respectRobotsTxt", Boolean(checked))}
                        />
                        <Label htmlFor="respect-robots">Respect robots.txt</Label>
                      </div>
                      <HelpTooltip content="Follow website crawling restrictions" />
                    </div>
                  </div>
                </div>
                
                {/* Proxy Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">Proxy Configuration</h3>
                    <HelpTooltip content="Configure proxy settings for scraping" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="proxy-service">Proxy Service</Label>
                      <Select
                        value={config.options.proxyUrl || ""}
                        onValueChange={(value) => handleOptionChange("proxyUrl", value)}
                      >
                        <SelectTrigger id="proxy-service">
                          <SelectValue placeholder="Select proxy service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Proxy</SelectItem>
                          {proxyServices.map((service) => (
                            <SelectItem key={service.name} value={service.url}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="user-agent">Custom User Agent</Label>
                      <Input
                        id="user-agent"
                        placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
                        value={config.options.userAgent || ""}
                        onChange={(e) => handleOptionChange("userAgent", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Priority Settings */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">Priority Settings</h3>
                    <HelpTooltip content="Configure job priority for scheduled or queued scraping" />
                  </div>
                  
                  <div className="space-y-2">
                    <RadioGroup
                      value={config.priority || "medium"}
                      onValueChange={(value: any) => setConfig({ ...config, priority: value })}
                      className="grid grid-cols-3 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id="priority-low" />
                        <Label htmlFor="priority-low">Low</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="priority-medium" />
                        <Label htmlFor="priority-medium">Medium</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="priority-high" />
                        <Label htmlFor="priority-high">High</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* AI Options Tab */}
          <TabsContent value="ai" className="space-y-6">
            {/* AI options content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-6">
                {/* AI Processing */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">AI Processing</h3>
                    <HelpTooltip content="Configure AI-powered processing options" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="use-ai"
                          checked={config.options.useAI}
                          onCheckedChange={(checked) => handleOptionChange("useAI", checked)}
                        />
                        <Label htmlFor="use-ai">Enable AI Processing</Label>
                      </div>
                      <HelpTooltip content="Use AI to enhance extraction and categorization" />
                    </div>
                    
                    {config.options.useAI && (
                      <div className="pl-6 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="ai-confidence">AI Confidence Threshold</Label>
                            <span className="text-sm text-muted-foreground">{config.options.aiConfidenceThreshold || 0.7}</span>
                          </div>
                          <Slider
                            id="ai-confidence"
                            min={0.1}
                            max={1.0}
                            step={0.05}
                            value={[config.options.aiConfidenceThreshold || 0.7]}
                            onValueChange={(value) => handleOptionChange("aiConfidenceThreshold", value[0])}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="extract-metadata"
                              checked={config.options.extractMetadata}
                              onCheckedChange={(checked) => handleOptionChange("extractMetadata", Boolean(checked))}
                            />
                            <Label htmlFor="extract-metadata">Extract Metadata</Label>
                          </div>
                          <HelpTooltip content="Extract additional metadata like authors, dates, etc." />
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAdvancedAI(!showAdvancedAI)}
                          className="w-full justify-between"
                        >
                          Advanced AI Options
                          {showAdvancedAI ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {showAdvancedAI && (
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="follow-links"
                                  checked={config.options.followLinks}
                                  onCheckedChange={(checked) => handleOptionChange("followLinks", Boolean(checked))}
                                />
                                <Label htmlFor="follow-links">Follow Links</Label>
                              </div>
                              <HelpTooltip content="Follow links to extract more data" />
                            </div>
                            
                            {config.options.followLinks && (
                              <div className="pl-6 space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="max-link-depth">Maximum Link Depth</Label>
                                  <span className="text-sm text-muted-foreground">{config.options.maxLinkDepth || 1}</span>
                                </div>
                                <Slider
                                  id="max-link-depth"
                                  min={1}
                                  max={5}
                                  step={1}
                                  value={[config.options.maxLinkDepth || 1]}
                                  onValueChange={(value) => handleOptionChange("maxLinkDepth", value[0])}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right column */}
              <div className="space-y-6">
                {/* LLM Optimization */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">LLM Optimization</h3>
                    <HelpTooltip content="Optimize output for Large Language Models" />
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Configure how the scraped data should be formatted for optimal use with Large Language Models.
                    </p>
                    
                    <Button
                      variant="outline"
                      onClick={() => setShowLLMFormatting(true)}
                      className="w-full"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Configure LLM Format
                    </Button>
                    
                    {config.metadata?.llmFormat && (
                      <div className="p-3 border rounded-md bg-muted/50">
                        <div className="flex items-center">
                          <div className="mr-3">
                            {config.metadata.llmFormat === "json" && <Braces className="h-5 w-5" />}
                            {config.metadata.llmFormat === "markdown" && <FileText className="h-5 w-5" />}
                            {config.metadata.llmFormat === "text" && <FileText className="h-5 w-5" />}
                            {config.metadata.llmFormat === "gemini" && <Sparkles className="h-5 w-5" />}
                            {config.metadata.llmFormat === "grok" && <Zap className="h-5 w-5" />}
                            {config.metadata.llmFormat === "openai" && <Bot className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium">
                              {config.metadata.llmFormat === "json" ? "JSON" : 
                               config.metadata.llmFormat === "markdown" ? "Markdown" : 
                               config.metadata.llmFormat.charAt(0).toUpperCase() + config.metadata.llmFormat.slice(1)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {config.metadata.llmOptimized ? "AI-optimized format" : "Standard format"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            {/* Schedule content */}
            {config.mode === "scheduled" && config.schedule ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-6">
                  {/* Schedule Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium">Schedule Configuration</h3>
                      <HelpTooltip content="Configure when the scraping job should run" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="schedule-frequency">Frequency</Label>
                        <Select
                          value={config.schedule.frequency}
                          onValueChange={(value: any) => setConfig({
                            ...config,
                            schedule: {
                              ...config.schedule!,
                              frequency: value,
                            },
                          })}
                        >
                          <SelectTrigger id="schedule-frequency">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                Daily
                              </div>
                            </SelectItem>
                            <SelectItem value="weekly">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                Weekly
                              </div>
                            </SelectItem>
                            <SelectItem value="monthly">
                              <div className="flex items-center">
                                <CalendarDays className="h-4 w-4 mr-2" />
                                Monthly
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="schedule-time">Time</Label>
                        <Input
                          id="schedule-time"
                          type="time"
                          value={config.schedule.time}
                          onChange={(e) => setConfig({
                            ...config,
                            schedule: {
                              ...config.schedule!,
                              time: e.target.value,
                            },
                          })}
                          className={validationErrors["scheduleTime"] ? "border-red-500" : ""}
                        />
                        {validationErrors["scheduleTime"] && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors["scheduleTime"]}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="schedule-timezone">Timezone</Label>
                        <Select
                          value={config.schedule.timezone || "UTC"}
                          onValueChange={(value: any) => setConfig({
                            ...config,
                            schedule: {
                              ...config.schedule!,
                              timezone: value,
                            },
                          })}
                        >
                          <SelectTrigger id="schedule-timezone">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            {timezones.map((timezone) => (
                              <SelectItem key={timezone.value} value={timezone.value}>
                                {timezone.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right column */}
                <div className="space-y-6">
                  {/* Schedule Details */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium">Schedule Details</h3>
                      <HelpTooltip content="Additional schedule configuration" />
                    </div>
                    
                    <div className="space-y-4">
                      {config.schedule.frequency === "weekly" && (
                        <div className="space-y-2">
                          <Label>Days of Week</Label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: 0, label: "Sun" },
                              { value: 1, label: "Mon" },
                              { value: 2, label: "Tue" },
                              { value: 3, label: "Wed" },
                              { value: 4, label: "Thu" },
                              { value: 5, label: "Fri" },
                              { value: 6, label: "Sat" },
                            ].map((day) => (
                              <Badge
                                key={day.value}
                                variant={config.schedule?.daysOfWeek?.includes(day.value) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                  const currentDays = config.schedule?.daysOfWeek || [];
                                  const newDays = currentDays.includes(day.value)
                                    ? currentDays.filter((d) => d !== day.value)
                                    : [...currentDays, day.value];
                                  
                                  setConfig({
                                    ...config,
                                    schedule: {
                                      ...config.schedule!,
                                      daysOfWeek: newDays,
                                    },
                                  });
                                }}
                              >
                                {day.label}
                              </Badge>
                            ))}
                          </div>
                          {validationErrors["scheduleDays"] && (
                            <p className="text-sm text-red-500 mt-1">{validationErrors["scheduleDays"]}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="schedule-enabled"
                            checked={config.schedule.enabled !== false}
                            onCheckedChange={(checked) => setConfig({
                              ...config,
                              schedule: {
                                ...config.schedule!,
                                enabled: checked,
                              },
                            })}
                          />
                          <Label htmlFor="schedule-enabled">Enable Schedule</Label>
                        </div>
                        <HelpTooltip content="Enable or disable this scheduled job" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="schedule-start-date">Start Date (Optional)</Label>
                        <Input
                          id="schedule-start-date"
                          type="date"
                          value={config.schedule.startDate || ""}
                          onChange={(e) => setConfig({
                            ...config,
                            schedule: {
                              ...config.schedule!,
                              startDate: e.target.value || undefined,
                            },
                          })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="schedule-end-date">End Date (Optional)</Label>
                        <Input
                          id="schedule-end-date"
                          type="date"
                          value={config.schedule.endDate || ""}
                          onChange={(e) => setConfig({
                            ...config,
                            schedule: {
                              ...config.schedule!,
                              endDate: e.target.value || undefined,
                            },
                          })}
                          min={config.schedule.startDate || undefined}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Select "Scheduled Scraping" mode to configure schedule settings
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue" className="space-y-6">
            {/* Queue content */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium">Queue Configuration</h3>
                  <HelpTooltip content="Configure queue settings for this job" />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="queue-priority">Priority</Label>
                    <RadioGroup
                      value={config.priority || "medium"}
                      onValueChange={(value: any) => setConfig({ ...config, priority: value })}
                      className="grid grid-cols-3 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id="queue-priority-low" />
                        <Label htmlFor="queue-priority-low">Low</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="queue-priority-medium" />
                        <Label htmlFor="queue-priority-medium">Medium</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="queue-priority-high" />
                        <Label htmlFor="queue-priority-high">High</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="batch-id">Batch ID (Optional)</Label>
                    <Input
                      id="batch-id"
                      placeholder="Enter batch ID for grouping jobs"
                      value={config.batchId || ""}
                      onChange={(e) => setConfig({ ...config, batchId: e.target.value || undefined })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Group related jobs together with a batch ID
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium">Queue Information</h3>
                  <HelpTooltip content="Information about the queue system" />
                </div>
                
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Queue System</AlertTitle>
                    <AlertDescription>
                      Jobs are processed based on priority and submission time. High priority jobs are processed first, followed by medium and low priority jobs.
                    </AlertDescription>
                  </Alert>
                  
                  <p className="text-sm">
                    To view and manage queued jobs, go to the Queue tab in the main dashboard.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 mt-4">
        <Button
          variant="outline"
          onClick={() => setConfig(defaultConfig)}
          disabled={isLoading}
        >
          Reset
        </Button>
        <Button
          variant="outline"
          onClick={handleSaveConfiguration}
          disabled={isLoading || isSaving}
        >
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
        <Button
          onClick={handleStartScraping}
          disabled={isLoading || !isValidConfig}
        >
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
          {isLoading ? "Scraping..." : "Start Scraping"}
        </Button>
      </div>

      {/* Custom Entity Dialog */}
      <Dialog open={showCustomEntityDialog} onOpenChange={setShowCustomEntityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Entity</DialogTitle>
            <DialogDescription>
              Define a custom entity to extract from the content
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entity-name">Entity Name</Label>