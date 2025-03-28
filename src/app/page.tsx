"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  Code,
  ExternalLink,
  Github,
  Layers,
  MessageSquare,
  Database,
  BarChart4,
  Settings,
} from "lucide-react";
import ChatWidget from "@/components/chat/ChatWidget";
import Link from "next/link";

export default function Home() {
  const [activeTab, setActiveTab] = useState("features");
  const [showChatWidget, setShowChatWidget] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Set initial dimensions
    if (typeof window !== "undefined") {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Add event listener for window resize
      const handleResize = () => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      // Throttle resize events for better performance
      let resizeTimer: NodeJS.Timeout;
      const throttledResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 100);
      };

      window.addEventListener("resize", throttledResize);
      return () => {
        window.removeEventListener("resize", throttledResize);
        clearTimeout(resizeTimer);
      };
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 border-b">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Advanced Categorized Scraping Module
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  A powerful AI-driven system that extracts, categorizes, and
                  structures data from websites using NLP and pattern
                  recognition.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link href="/scraping">
                    Access Scraping Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  onClick={() => setShowChatWidget(!showChatWidget)}
                  variant="outline"
                  size="lg"
                >
                  {showChatWidget ? "Hide" : "Show"} Chat Widget
                  <MessageSquare className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[500px] aspect-video rounded-xl overflow-hidden border shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80"
                  alt="Data visualization"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-background/80 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <h3 className="font-bold text-xl">
                      Intelligent Data Extraction
                    </h3>
                    <p className="text-sm opacity-90">
                      Automatically categorize and structure web content
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container px-4 md:px-6 py-6 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="features">
              <Layers className="mr-2 h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="documentation">
              <Code className="mr-2 h-4 w-4" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="examples">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat Examples
            </TabsTrigger>
            <TabsTrigger value="resources">
              <Github className="mr-2 h-4 w-4" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="flex flex-col">
                <CardHeader>
                  <Database className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Advanced Web Scraping</CardTitle>
                  <CardDescription>
                    Extract data from any website with precision
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    Configure custom selectors, handle dynamic content, and
                    extract structured data from single or multiple pages with
                    our powerful scraping engine.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/scraping">
                      Open Scraping Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="flex flex-col">
                <CardHeader>
                  <Settings className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Intelligent Categorization</CardTitle>
                  <CardDescription>
                    Automatically organize extracted content
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    Our AI-powered system automatically categorizes content into
                    meaningful groups like services, pricing, documents, and
                    more using advanced NLP.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/scraping?tab=results">
                      View Categorization
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="flex flex-col">
                <CardHeader>
                  <BarChart4 className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Comprehensive Analytics</CardTitle>
                  <CardDescription>
                    Gain insights from your scraped data
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    Track scraping performance, monitor success rates, and
                    visualize data patterns with our built-in analytics
                    dashboard.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/scraping?tab=analytics">
                      Explore Analytics
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documentation" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>
                    Learn how to use the scraping module
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure your first scraping job and extract structured
                    data from any website.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="#">
                      Read Guide
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Categorization Rules</CardTitle>
                  <CardDescription>
                    Define custom data categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Learn how to create and customize categorization rules for
                    different types of content.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="#">
                      View Documentation
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Reference</CardTitle>
                  <CardDescription>
                    Integrate with your applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comprehensive API documentation for developers to integrate
                    the scraping module.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="#">
                      Explore API
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Product Catalog Extraction</CardTitle>
                  <CardDescription>
                    Extract product details from e-commerce sites
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This example demonstrates how to extract and categorize
                    product information including prices, descriptions, and
                    specifications.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Information Extraction</CardTitle>
                  <CardDescription>
                    Extract service details from business websites
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Learn how to extract service offerings, pricing tiers, and
                    eligibility requirements from service provider websites.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>News Article Categorization</CardTitle>
                  <CardDescription>
                    Categorize news content by topic
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    See how the system automatically categorizes news articles
                    by topic, sentiment, and relevance.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Document Extraction</CardTitle>
                  <CardDescription>
                    Extract structured data from documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This example shows how to extract and categorize information
                    from PDFs, DOCs, and other document formats.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>GitHub Repository</CardTitle>
                  <CardDescription>Access the source code</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View the source code, contribute to the project, or report
                    issues on GitHub.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="https://github.com" target="_blank">
                      <Github className="mr-2 h-4 w-4" />
                      View Repository
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community Forum</CardTitle>
                  <CardDescription>Join the discussion</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect with other users, share tips, and get help from the
                    community.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="#">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Join Forum
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Video Tutorials</CardTitle>
                  <CardDescription>Learn through video guides</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Watch step-by-step video tutorials on how to use the
                    scraping module effectively.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="#">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Watch Tutorials
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Footer */}
      <footer className="w-full border-t py-6">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-muted-foreground md:text-left">
              © {new Date().getFullYear()} Advanced Categorized Scraping
              Module. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:underline"
              >
                Terms of Service
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:underline"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:underline"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      {showChatWidget && (
        <ChatWidget
          title="AI Assistant"
          aiName="Scraping Assistant"
          aiAvatarUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=scraping-ai"
          initialPosition={{ x: windowDimensions.width - 380, y: 20 }}
          initialSize={{ width: 350, height: 500 }}
          initiallyOpen={false}
          zIndex={1001}
        />
      )}
    </main>
  );
}
