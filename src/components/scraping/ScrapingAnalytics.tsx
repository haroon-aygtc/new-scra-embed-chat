"use client";

import React from "react";
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

const defaultData = {
  jobStats: {
    total: 124,
    completed: 98,
    failed: 12,
    pending: 14,
  },
  categoryStats: [
    { name: "Services", count: 156 },
    { name: "Fees", count: 89 },
    { name: "Documents", count: 67 },
    { name: "Eligibility", count: 42 },
  ],
  timeStats: [
    { date: "Mon", jobs: 12, success: 10 },
    { date: "Tue", jobs: 19, success: 17 },
    { date: "Wed", jobs: 15, success: 13 },
    { date: "Thu", jobs: 22, success: 20 },
    { date: "Fri", jobs: 18, success: 15 },
    { date: "Sat", jobs: 8, success: 7 },
    { date: "Sun", jobs: 6, success: 6 },
  ],
  performanceStats: [
    { name: "< 5s", value: 42 },
    { name: "5-15s", value: 28 },
    { name: "15-30s", value: 16 },
    { name: "> 30s", value: 12 },
  ],
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const ScrapingAnalytics: React.FC<ScrapingAnalyticsProps> = ({
  data = defaultData,
}) => {
  const [activeTab, setActiveTab] = React.useState("overview");

  const { jobStats, categoryStats, timeStats, performanceStats } = data;

  return (
    <div className="w-full h-full flex flex-col bg-background border rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium">Scraping Analytics</h3>
      </div>

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
                  <div className="text-2xl font-bold">{jobStats?.total}</div>
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
                    {jobStats?.completed}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {jobStats?.failed}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {jobStats?.pending}
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
                    data={timeStats}
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
                      {categoryStats?.map((entry, index) => (
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
          </TabsContent>

          <TabsContent value="performance" className="mt-0 h-full">
            <Card className="h-[400px]">
              <CardHeader>
                <CardTitle className="text-base">Job Processing Time</CardTitle>
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
                      {performanceStats?.map((entry, index) => (
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
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ScrapingAnalytics;
