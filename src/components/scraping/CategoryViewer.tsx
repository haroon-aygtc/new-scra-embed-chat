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
  categories?: Record<string,