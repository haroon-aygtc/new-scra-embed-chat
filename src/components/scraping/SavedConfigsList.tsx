"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Save, Trash2, Clock, Calendar, Edit } from "lucide-react";
import { ScrapingConfig } from "@/types/scraping";
import { loadScrapingConfigurations } from "@/lib/api/scraping";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SavedConfigsListProps {
  onLoadConfig: (config: ScrapingConfig) => void;
  onDeleteConfig?: (configId: string) => void;
}

const SavedConfigsList: React.FC<SavedConfigsListProps> = ({
  onLoadConfig,
  onDeleteConfig = () => {},
}) => {
  const [configs, setConfigs] = useState<ScrapingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedConfigs = await loadScrapingConfigurations();
      setConfigs(loadedConfigs);
    } catch (error: any) {
      console.error("Error loading configurations:", error);
      setError(error.message || "Failed to load configurations");
      // Set some sample data for demonstration
      setConfigs([
        {
          id: "config_1",
          name: "Basic Website Scraper",
          url: "https://example.com",
          mode: "single",
          scrapingMode: "basic",
          selector: ".content",
          selectorType: "css",
          categories: ["Services", "Fees"],
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
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "config_2",
          name: "Daily News Scraper",
          url: "https://news-example.com",
          mode: "scheduled",
          scrapingMode: "thorough",
          selector: "article",
          selectorType: "css",
          categories: ["News", "Articles"],
          options: {
            handleDynamicContent: true,
            followPagination: true,
            extractImages: true,
            deduplicateResults: true,
            maxPages: 10,
            skipHeadersFooters: true,
            skipImagesMedia: false,
            stealthMode: true,
            respectRobotsTxt: true,
            rateLimitDelay: 2000,
          },
          outputFormat: "structured",
          schedule: {
            frequency: "daily",
            time: "08:00",
            enabled: true,
          },
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "config_3",
          name: "Multiple E-commerce Sites",
          url: "https://shop1-example.com",
          urls: [
            "https://shop1-example.com",
            "https://shop2-example.com",
            "https://shop3-example.com",
          ],
          mode: "multiple",
          scrapingMode: "semantic",
          selector: ".product",
          selectorType: "auto",
          categories: ["Products", "Prices", "Reviews"],
          options: {
            handleDynamicContent: true,
            followPagination: false,
            extractImages: true,
            deduplicateResults: true,
            maxPages: 3,
            skipHeadersFooters: false,
            skipImagesMedia: false,
            stealthMode: true,
            respectRobotsTxt: true,
            rateLimitDelay: 3000,
          },
          outputFormat: "json",
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredConfigs = configs.filter((config) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (config.name?.toLowerCase().includes(searchLower) ?? false) ||
      config.url.toLowerCase().includes(searchLower) ||
      config.mode.toLowerCase().includes(searchLower) ||
      config.categories.some((cat) => cat.toLowerCase().includes(searchLower))
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getModeBadgeColor = (mode: string) => {
    switch (mode) {
      case "single":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "multiple":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "scheduled":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-background border rounded-lg shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium">Saved Configurations</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search configurations..."
            className="pl-8 w-[250px]"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      <ScrollArea className="flex-grow p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Save className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">
              {searchTerm
                ? "No matching configurations"
                : "No saved configurations"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm
                ? "Try a different search term"
                : "Save a configuration to see it here"}
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredConfigs.map((config) => (
              <Card key={config.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {config.name || `Configuration ${config.id}`}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {config.url}
                        {config.urls && config.urls.length > 1 && (
                          <span className="text-xs ml-1">
                            +{config.urls.length - 1} more
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge
                      className={getModeBadgeColor(config.mode)}
                      variant="outline"
                    >
                      {config.mode.charAt(0).toUpperCase() +
                        config.mode.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {config.categories.map((category) => (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="text-xs"
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Created: {formatDate(config.createdAt || "")}
                    </div>
                    <div className="flex items-center">
                      <Edit className="h-3 w-3 mr-1" />
                      Updated: {formatDate(config.updatedAt || "")}
                    </div>
                    {config.mode === "scheduled" && config.schedule && (
                      <div className="flex items-center col-span-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule: {config.schedule.frequency} at{" "}
                        {config.schedule.time}
                        {config.schedule.enabled === false && " (disabled)"}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteConfig(config.id || "")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onLoadConfig(config)}
                  >
                    Load Configuration
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default SavedConfigsList;
