"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ScrapingDashboard from "@/components/scraping/ScrapingDashboard";
import Link from "next/link";

export default function ScrapingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="w-full py-4 px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">
              Advanced Scraping Dashboard
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="container px-4 md:px-6 py-6 flex-1">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Web Scraping Control Center
          </h2>
          <p className="text-muted-foreground mt-2">
            Configure, manage, and analyze your web scraping operations from
            this centralized dashboard.
          </p>
        </div>

        <div className="h-[800px] rounded-lg overflow-hidden border">
          <ScrapingDashboard />
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t py-4 px-6">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            Advanced Categorized Scraping Module © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </main>
  );
}
