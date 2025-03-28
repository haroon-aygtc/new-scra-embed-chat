import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Storyboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">
          Advanced Categorized Scraping Module
        </h1>
        <p className="text-muted-foreground">
          A powerful AI-driven system that extracts, categorizes, and structures
          data from websites using NLP and pattern recognition.
        </p>
        <div className="pt-4">
          <Button asChild size="lg" className="w-full">
            <Link href="/scraping">
              Access Scraping Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
