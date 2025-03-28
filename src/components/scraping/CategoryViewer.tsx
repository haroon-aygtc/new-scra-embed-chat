"use client";

import React, { useState, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Download,
  Edit,
  Trash2,
  Plus,
  FileText,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  SlidersHorizontal,
  FileJson,
  FileSpreadsheet,
  FileCode,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CategoryItem {
  id: string;
  title: string;
  content: string;
  source?: string;
  confidence?: number;
  verified?: boolean;
  metadata?: Record<string, any>;
}

interface CategoryData {
  items: CategoryItem[];
  description: string;
  metadata?: Record<string, any>;
}

interface CategoryViewerProps {
  categories?: Record<string, CategoryData>;
  onEdit?: (categoryId: string, itemId: string) => void;
  onDelete?: (categoryId: string, itemId: string) => void;
  onVerify?: (categoryId: string, itemId: string, verified: boolean) => void;
  onExport?: (format: string, categoryId?: string) => void;
  className?: string;
}

const CategoryViewer: React.FC<CategoryViewerProps> = ({
  categories = {},
  onEdit,
  onDelete,
  onVerify,
  onExport,
  className,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVerified, setFilterVerified] = useState<boolean | null>(null);

  // Set the first category as active if none is selected
  React.useEffect(() => {
    if (!activeCategory && Object.keys(categories).length > 0) {
      setActiveCategory(Object.keys(categories)[0]);
    }
  }, [categories, activeCategory]);

  const categoryKeys = Object.keys(categories);

  const filteredItems =
    activeCategory && categories[activeCategory]
      ? categories[activeCategory].items.filter((item) => {
          const matchesSearch =
            searchTerm === "" ||
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.content.toLowerCase().includes(searchTerm.toLowerCase());

          const matchesVerified =
            filterVerified === null || item.verified === filterVerified;

          return matchesSearch && matchesVerified;
        })
      : [];

  const handleExport = (format: string) => {
    if (onExport) {
      onExport(format, activeCategory || undefined);
    }
  };

  return (
    <Card
      className={cn("w-full h-full overflow-hidden flex flex-col", className)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Categorized Data</CardTitle>
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("json")}>
                <FileJson className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("txt")}>
                <FileText className="mr-2 h-4 w-4" />
                Export as Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("html")}>
                <FileCode className="mr-2 h-4 w-4" />
                Export as HTML
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {categoryKeys.length > 0 ? (
        <Tabs
          value={activeCategory || undefined}
          onValueChange={(value) => setActiveCategory(value)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-4 border-b">
            <TabsList className="w-full h-auto justify-start overflow-x-auto py-0">
              {categoryKeys.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="py-2 px-4 whitespace-nowrap"
                >
                  {category} ({categories[category].items.length})
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {categoryKeys.map((category) => (
            <TabsContent
              key={category}
              value={category}
              className="flex-1 overflow-hidden flex flex-col mt-0 pt-0"
            >
              <div className="p-4 border-b flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search in this category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Button
                    variant={filterVerified === true ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setFilterVerified(filterVerified === true ? null : true)
                    }
                    className="h-8"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Verified
                  </Button>
                  <Button
                    variant={filterVerified === false ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setFilterVerified(filterVerified === false ? null : false)
                    }
                    className="h-8"
                  >
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    Unverified
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {categories[category].description}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {filteredItems.length > 0 ? (
                  <div className="grid gap-3">
                    {filteredItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardHeader className="py-3 px-4">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base font-medium">
                              {item.title}
                            </CardTitle>
                            <div className="flex items-center gap-1">
                              {item.verified !== undefined && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                          onVerify &&
                                          onVerify(
                                            category,
                                            item.id,
                                            !item.verified,
                                          )
                                        }
                                      >
                                        {item.verified ? (
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <AlertCircle className="h-4 w-4 text-amber-500" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {item.verified
                                          ? "Verified"
                                          : "Not verified"}{" "}
                                        - Click to change
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}

                              {onEdit && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                          onEdit(category, item.id)
                                        }
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit item</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}

                              {onDelete && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                          onDelete(category, item.id)
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete item</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-3 px-4 border-t bg-muted/30">
                          <div className="whitespace-pre-wrap text-sm">
                            {item.content}
                          </div>
                          {item.source && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Source: {item.source}
                            </div>
                          )}
                          {item.confidence !== undefined && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Confidence: {(item.confidence * 100).toFixed(1)}%
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                    <File className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No items found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchTerm || filterVerified !== null
                        ? "Try adjusting your search or filters"
                        : "This category doesn't have any items yet"}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <SlidersHorizontal className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No categories available</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            No categorized data has been created yet. Run a scraping job with
            categorization enabled to see results here.
          </p>
        </div>
      )}
    </Card>
  );
};

export default CategoryViewer;
