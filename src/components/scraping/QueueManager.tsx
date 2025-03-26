"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Play, Pause, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueueItem {
  id: string;
  config: any;
  status: "pending" | "processing" | "completed" | "failed" | "retrying";
  progress: number;
  result?: any;
  error?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

interface QueueManagerProps {
  onRefresh?: () => void;
  onRemoveJob?: (jobId: string) => void;
  onPauseQueue?: () => void;
  onResumeQueue?: () => void;
  isPaused?: boolean;
}

const QueueManager: React.FC<QueueManagerProps> = ({
  onRefresh = () => {},
  onRemoveJob = () => {},
  onPauseQueue = () => {},
  onResumeQueue = () => {},
  isPaused = false,
}) => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch queue items
  const fetchQueueItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // In a production environment, this would fetch from the API
      // For this implementation, we'll use sample data
      const response = await fetch("/api/scraping/queue");

      if (!response.ok) {
        throw new Error("Failed to fetch queue items");
      }

      const data = await response.json();
      setQueueItems(data);
    } catch (error: any) {
      console.error("Error fetching queue items:", error);
      setError(error.message || "Failed to fetch queue items");

      // Use sample data for demonstration
      setQueueItems([
        {
          id: "job_1",
          config: {
            url: "https://example.com",
            mode: "single",
            scrapingMode: "basic",
            priority: "high",
          },
          status: "processing",
          progress: 45,
          retryCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "job_2",
          config: {
            url: "https://example.org",
            mode: "single",
            scrapingMode: "thorough",
            priority: "medium",
          },
          status: "pending",
          progress: 0,
          retryCount: 0,
          createdAt: new Date(Date.now() - 60000).toISOString(),
          updatedAt: new Date(Date.now() - 60000).toISOString(),
        },
        {
          id: "job_3",
          config: {
            url: "https://example.net",
            mode: "single",
            scrapingMode: "semantic",
            priority: "low",
          },
          status: "completed",
          progress: 100,
          retryCount: 0,
          createdAt: new Date(Date.now() - 120000).toISOString(),
          updatedAt: new Date(Date.now() - 30000).toISOString(),
        },
        {
          id: "job_4",
          config: {
            url: "https://invalid-url.com",
            mode: "single",
            scrapingMode: "basic",
            priority: "medium",
          },
          status: "failed",
          progress: 30,
          error: "Failed to fetch URL: 404 Not Found",
          retryCount: 3,
          createdAt: new Date(Date.now() - 180000).toISOString(),
          updatedAt: new Date(Date.now() - 90000).toISOString(),
        },
        {
          id: "job_5",
          config: {
            url: "https://retry-example.com",
            mode: "single",
            scrapingMode: "basic",
            priority: "high",
          },
          status: "retrying",
          progress: 0,
          error: "Connection timeout",
          retryCount: 1,
          createdAt: new Date(Date.now() - 240000).toISOString(),
          updatedAt: new Date(Date.now() - 120000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch queue items on mount
  useEffect(() => {
    fetchQueueItems();
  }, []);

  // Filter queue items based on active tab
  const filteredItems = queueItems.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "active")
      return ["pending", "processing", "retrying"].includes(item.status);
    if (activeTab === "completed") return item.status === "completed";
    if (activeTab === "failed") return item.status === "failed";
    return true;
  });

  // Get queue stats
  const queueStats = {
    total: queueItems.length,
    active: queueItems.filter((item) =>
      ["pending", "processing", "retrying"].includes(item.status),
    ).length,
    completed: queueItems.filter((item) => item.status === "completed").length,
    failed: queueItems.filter((item) => item.status === "failed").length,
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchQueueItems();
    onRefresh();
  };

  // Handle remove job
  const handleRemoveJob = (jobId: string) => {
    // In a production environment, this would call the API
    onRemoveJob(jobId);
    setQueueItems(queueItems.filter((item) => item.id !== jobId));
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "retrying":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-background rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-xl font-semibold">Queue Manager</h2>
          <p className="text-sm text-muted-foreground">
            Manage scraping jobs and queue
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={isPaused ? onResumeQueue : onPauseQueue}
          >
            {isPaused ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume Queue
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause Queue
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-4 gap-4 p-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {queueStats.active}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {queueStats.completed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {queueStats.failed}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="px-4 border-b">
          <TabsList>
            <TabsTrigger value="all">All Jobs ({queueStats.total})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({queueStats.active})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({queueStats.completed})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Failed ({queueStats.failed})
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent value={activeTab} className="mt-0">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-muted-foreground mb-2">No jobs found</p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {item.config.url}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge
                              className={cn(
                                "text-xs",
                                getStatusBadgeColor(item.status),
                              )}
                            >
                              {item.status.charAt(0).toUpperCase() +
                                item.status.slice(1)}
                            </Badge>
                            <Badge
                              className={cn(
                                "text-xs",
                                getPriorityBadgeColor(
                                  item.config.priority || "medium",
                                ),
                              )}
                            >
                              {item.config.priority
                                ? item.config.priority.charAt(0).toUpperCase() +
                                  item.config.priority.slice(1)
                                : "Medium"}{" "}
                              Priority
                            </Badge>
                            <Badge className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                              {item.config.scrapingMode
                                .charAt(0)
                                .toUpperCase() +
                                item.config.scrapingMode.slice(1)}{" "}
                              Mode
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveJob(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {item.status === "processing" && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                        </div>
                      )}
                      {item.error && (
                        <Alert
                          variant="destructive"
                          className="mt-2 py-2 text-sm"
                        >
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{item.error}</AlertDescription>
                        </Alert>
                      )}
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Updated:</span>{" "}
                          {new Date(item.updatedAt).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Job ID:</span> {item.id}
                        </div>
                        <div>
                          <span className="font-medium">Retry Count:</span>{" "}
                          {item.retryCount}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default QueueManager;
