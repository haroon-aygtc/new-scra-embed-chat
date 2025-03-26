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
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import ScrapingConfigPanel from "./ScrapingConfigPanel";
import ScrapingResultsPanel from "./ScrapingResultsPanel";
import QueueManager from "./QueueManager";
import ScrapingAnalytics from "./ScrapingAnalytics";
import { ScrapingConfig, ScrapingResult } from "@/types/scraping";
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
        return;
      }

      // Perform the scraping operation for non-scheduled jobs
      const result = await performScraping(config);

      // Update the UI with the results
      setScrapingResults(result);
      setLastUpdated(new Date().toLocaleString());
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
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            )}
            {activeTab === "scraping" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveConfiguration({} as ScrapingConfig)}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TabsContent value="scraping" className="mt-0">
          <ScrapingConfigPanel
            onStartScraping={handleStartScraping}
            onSaveConfiguration={handleSaveConfiguration}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="results" className="mt-0">
          <ScrapingResultsPanel
            results={scrapingResults}
            lastUpdated={lastUpdated}
            isLoading={isLoading}
          />
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
