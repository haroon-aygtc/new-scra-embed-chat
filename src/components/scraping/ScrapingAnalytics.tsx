"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScrapingAnalyticsProps {
  data?: {
    jobStats?: {
      total: number;
      completed: number;
      failed: number;
      pending: number;
    };
    categoryStats?: {
      name: string;
      count: number;
    }[];
    timeStats?: {
      date: string;
      jobs: number;
      success: number;
    }[];
    performanceStats?: {
      name: string;
      value: number;
    }[];
  };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const ScrapingAnalytics: React.FC<ScrapingAnalyticsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [analyticsData, setAnalyticsData] = useState<
    ScrapingAnalyticsProps["data"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If data is provided via props, use it
    if (data) {
      setAnalyticsData(data);
      return;
    }

    // Otherwise fetch data from API
    fetchAnalyticsData();
  }, [data]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch analytics data from API
      const response = await fetch("/api/scraping/analytics");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch analytics data");
      }

      const analyticsData = await response.json();
      setAnalyticsData(analyticsData);
    } catch (err: any) {
      console.error("Error fetching analytics data:", err);
      setError(
        err.message || "An error occurred while fetching analytics data",
      );

      // If we can't fetch data, we'll use calculated data based on available results
      await calculateAnalyticsFromResults();
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnalyticsFromResults = async () => {
    try {
      // Fetch all scraping results to calculate analytics
      const response = await fetch("/api/scraping/results");

      if (!response.ok) {
        throw new Error("Failed to fetch results for analytics calculation");
      }

      const results = await response.json();

      if (!Array.isArray(results) || results.length === 0) {
        // No results to calculate from
        setAnalyticsData({
          jobStats: { total: 0, completed: 0, failed: 0, pending: 0 },
          categoryStats: [],
          timeStats: [],
          performanceStats: [],
        });
        return;
      }

      // Calculate job stats
      const completed = results.filter((r) => r.status === "success").length;
      const failed = results.filter((r) => r.status === "failed").length;
      const pending = results.filter((r) => r.status === "pending").length;
      const total = results.length;

      // Calculate category stats
      const categoryMap = new Map<string, number>();
      results.forEach((result) => {
        if (result.categories) {
          Object.keys(result.categories).forEach((category) => {
            const count = result.categories[category]?.items?.length || 0;
            categoryMap.set(category, (categoryMap.get(category) || 0) + count);
          });
        }
      });

      const categoryStats = Array.from(categoryMap.entries()).map(
        ([name, count]) => ({
          name,
          count,
        }),
      );

      // Calculate time stats (last 7 days)
      const timeStats = [];
      const now = new Date();
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStr = dayNames[date.getDay()];

        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const dayJobs = results.filter((r) => {
          const timestamp = new Date(r.timestamp);
          return timestamp >= dayStart && timestamp <= dayEnd;
        });

        const daySuccesses = dayJobs.filter((r) => r.status === "success");

        timeStats.push({
          date: dayStr,
          jobs: dayJobs.length,
          success: daySuccesses.length,
        });
      }

      // Calculate performance stats
      const performanceBuckets = {
        "< 5s": 0,
        "5-15s": 0,
        "15-30s": 0,
        "> 30s": 0,
      };

      results.forEach((result) => {
        const processingTime = result.metadata?.processingTime || 0;

        if (processingTime < 5000) {
          performanceBuckets["< 5s"]++;
        } else if (processingTime < 15000) {
          performanceBuckets["5-15s"]++;
        } else if (processingTime < 30000) {
          performanceBuckets["15-30s"]++;
        } else {
          performanceBuckets["> 30s"]++;
        }
      });

      const performanceStats = Object.entries(performanceBuckets).map(
        ([name, value]) => ({
          name,
          value,
        }),
      );

      setAnalyticsData({
        jobStats: { total, completed, failed, pending },
        categoryStats,
        timeStats,
        performanceStats,
      });
    } catch (err: any) {
      console.error("Error calculating analytics from results:", err);
      // If all else fails, set empty data
      setAnalyticsData({
        jobStats: { total: 0, completed: 0, failed: 0, pending: 0 },
        categoryStats: [],
        timeStats: [],
        performanceStats: [],
      });
    }
  };

  // Use the fetched data or the data passed via props
  const { jobStats, categoryStats, timeStats, performanceStats } =
    analyticsData || {};

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background border rounded-lg shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-background border rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium">Scraping Analytics</h3>
      </div>

      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="px-4 border-b">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="overview" className="mt-0 h-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {jobStats?.total || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {jobStats?.completed || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {jobStats?.failed || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {jobStats?.pending || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="h-[300px]">
              <CardHeader>
                <CardTitle className="text-base">Weekly Job Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeStats || []}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="jobs" fill="#8884d8" name="Total Jobs" />
                    <Bar
                      dataKey="success"
                      fill="#82ca9d"
                      name="Successful Jobs"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-0 h-full">
            {categoryStats && categoryStats.length > 0 ? (
              <Card className="h-[400px]">
                <CardHeader>
                  <CardTitle className="text-base">Items by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryStats}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" name="Item Count">
                        {categoryStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm text-muted-foreground">
                  No category data available. Run some scraping jobs to see
                  category statistics.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="mt-0 h-full">
            {performanceStats && performanceStats.length > 0 ? (
              <Card className="h-[400px]">
                <CardHeader>
                  <CardTitle className="text-base">
                    Job Processing Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={performanceStats}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {performanceStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} jobs`, "Count"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm text-muted-foreground">
                  No performance data available. Run some scraping jobs to see
                  performance statistics.
                </p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ScrapingAnalytics;
