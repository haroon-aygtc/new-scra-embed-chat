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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CategoryItem {
  id: string;
  title: string;
  content: string;
  source?: string;
  confidence?: number;
  verified?: boolean;
}

interface CategoryData {
  items: CategoryItem[];
  description: string;
}

interface CategoryViewerProps {
  categories?: Record<string, CategoryData>;
  onEdit?: (category: string, item: CategoryItem) => void;
  onDelete?: (category: string, itemId: string) => void;
  onAdd?: (category: string) => void;
  onExport?: (category: string, format: "json" | "csv" | "txt") => void;
  onVerify?: (category: string, itemId: string, verified: boolean) => void;
}

const defaultCategories: Record<string, CategoryData> = {
  services: {
    description: "Services offered by the organization",
    items: [
      {
        id: "1",
        title: "Website Development",
        content:
          "Custom website development services for businesses of all sizes.",
        source: "https://example.com/services",
        confidence: 0.95,
        verified: true,
      },
      {
        id: "2",
        title: "Mobile App Development",
        content: "Native and cross-platform mobile application development.",
        source: "https://example.com/services",
        confidence: 0.92,
        verified: false,
      },
      {
        id: "3",
        title: "UI/UX Design",
        content: "User interface and experience design for digital products.",
        source: "https://example.com/services",
        confidence: 0.88,
        verified: true,
      },
    ],
  },
  fees: {
    description: "Pricing and fee structure",
    items: [
      {
        id: "1",
        title: "Basic Package",
        content:
          "$999 - Includes website design and development with up to 5 pages.",
        source: "https://example.com/pricing",
        confidence: 0.97,
        verified: true,
      },
      {
        id: "2",
        title: "Premium Package",
        content:
          "$2,499 - Includes website design, development, SEO optimization, and 1 month of maintenance.",
        source: "https://example.com/pricing",
        confidence: 0.94,
        verified: true,
      },
    ],
  },
  documents: {
    description: "Required documents and forms",
    items: [
      {
        id: "1",
        title: "Project Brief Template",
        content:
          "A template for clients to outline their project requirements.",
        source: "https://example.com/documents",
        confidence: 0.91,
        verified: true,
      },
      {
        id: "2",
        title: "Service Agreement",
        content: "Legal agreement outlining the terms of service.",
        source: "https://example.com/documents",
        confidence: 0.96,
        verified: true,
      },
    ],
  },
  eligibility: {
    description: "Eligibility criteria for services",
    items: [
      {
        id: "1",
        title: "Business Clients",
        content:
          "Available for registered businesses with valid business identification.",
        source: "https://example.com/eligibility",
        confidence: 0.89,
        verified: false,
      },
      {
        id: "2",
        title: "Individual Clients",
        content:
          "Available for individuals with valid ID and proof of address.",
        source: "https://example.com/eligibility",
        confidence: 0.85,
        verified: true,
      },
    ],
  },
};

const CategoryViewer: React.FC<CategoryViewerProps> = ({
  categories = defaultCategories,
  onEdit,
  onDelete,
  onAdd,
  onExport,
  onVerify,
}) => {
  const [activeTab, setActiveTab] = useState<string>(
    Object.keys(categories)[0] || "services",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVerified, setFilterVerified] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<"title" | "confidence" | "date">(
    "title",
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (format: "json" | "csv" | "txt") => {
    if (onExport) {
      onExport(activeTab, format);
    }
  };

  // Filter and sort items based on search term, verification status, and sort order
  const getFilteredItems = (items: CategoryItem[]) => {
    return items
      .filter((item) => {
        // Apply search filter
        const matchesSearch =
          searchTerm === "" ||
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.content.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply verification filter if set
        const matchesVerification =
          filterVerified === null || item.verified === filterVerified;

        return matchesSearch && matchesVerification;
      })
      .sort((a, b) => {
        // Apply sorting
        switch (sortBy) {
          case "confidence":
            return (b.confidence || 0) - (a.confidence || 0);
          case "date":
            return (
              new Date(b.updatedAt || "").getTime() -
              new Date(a.updatedAt || "").getTime()
            );
          case "title":
          default:
            return a.title.localeCompare(b.title);
        }
      });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchTerm("");
      searchInputRef.current?.blur();
    }
  };

  return (
    <div className="w-full h-full bg-background rounded-lg border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Categorized Data</h2>
        <div className="flex space-x-2">
          <div className="relative mr-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search items..."
              className="pl-8 w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterVerified(null)}>
                All Items
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterVerified(true)}>
                Verified Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterVerified(false)}>
                Unverified Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy("title")}>
                By Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("confidence")}>
                By Confidence
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("date")}>
                By Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("txt")}>
                Export as Text
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filterVerified !== null && (
        <div className="mb-4 flex items-center">
          <div className="flex items-center gap-1 px-2 py-1 rounded border text-sm">
            {filterVerified ? (
              <>
                <CheckCircle className="h-3 w-3" />
                <span>Showing verified items only</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                <span>Showing unverified items only</span>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => setFilterVerified(null)}
            >
              <span className="sr-only">Clear filter</span>×
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4 bg-muted">
          {Object.keys(categories).map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="flex-1 capitalize"
            >
              {category} ({categories[category].items.length})
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(categories).map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {categories[category].description}
              </p>
              {onAdd && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAdd(category)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFilteredItems(categories[category].items).map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <div className="flex items-center space-x-1">
                        {item.verified !== undefined && (
                          <div
                            className={cn(
                              "flex items-center text-xs px-2 py-1 rounded",
                              item.verified
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800",
                            )}
                          >
                            {item.verified ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Unverified
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{item.content}</p>
                    {item.source && (
                      <div className="mt-2 flex items-center text-xs text-muted-foreground">
                        <FileText className="h-3 w-3 mr-1" />
                        Source: {item.source}
                      </div>
                    )}
                    {item.confidence !== undefined && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Confidence: {(item.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2 pt-2">
                    {onVerify && item.verified !== undefined && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onVerify(category, item.id, !item.verified)
                        }
                      >
                        {item.verified ? "Mark Unverified" : "Verify"}
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(category, item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(category, item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>

            {getFilteredItems(categories[category].items).length === 0 &&
              categories[category].items.length > 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center col-span-2">
                  <Search className="h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No matching items</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your search or filters
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterVerified(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}

            {categories[category].items.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No items found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  There are no items in this category yet.
                </p>
                {onAdd && (
                  <Button variant="outline" onClick={() => onAdd(category)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CategoryViewer;
