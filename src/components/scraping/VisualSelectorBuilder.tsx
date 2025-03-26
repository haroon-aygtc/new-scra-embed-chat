"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  EyeOff,
  Crosshair,
  Save,
  Trash2,
  Plus,
  Check,
  X,
  AlertCircle,
  Code,
  MousePointer,
  Layers,
  FileJson,
  RefreshCw,
} from "lucide-react";

interface VisualSelectorBuilderProps {
  url: string;
  onSave?: (selectors: any) => void;
  onClose?: () => void;
}

const VisualSelectorBuilder: React.FC<VisualSelectorBuilderProps> = ({
  url,
  onSave = () => {},
  onClose = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("visual");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedElements, setSelectedElements] = useState<any[]>([]);
  const [hoveredElement, setHoveredElement] = useState<any | null>(null);
  const [generatedSelectors, setGeneratedSelectors] = useState<any>({
    css: {},
    xpath: {},
  });

  // Initialize iframe and messaging
  useEffect(() => {
    const iframe = document.getElementById(
      "selector-iframe",
    ) as HTMLIFrameElement;
    if (!iframe) return;

    const handleIframeLoad = () => {
      setIframeLoaded(true);
      setIsLoading(false);

      try {
        // Initialize the selector tool in the iframe
        iframe.contentWindow?.postMessage({ type: "INIT_SELECTOR_TOOL" }, "*");
      } catch (err) {
        console.error("Error initializing selector tool:", err);
        setError("Failed to initialize selector tool");
      }
    };

    iframe.addEventListener("load", handleIframeLoad);

    // Handle messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "ELEMENT_HOVERED") {
        setHoveredElement(event.data.element);
      } else if (event.data.type === "ELEMENT_SELECTED") {
        addSelectedElement(event.data.element);
      } else if (event.data.type === "SELECTORS_GENERATED") {
        setGeneratedSelectors(event.data.selectors);
      } else if (event.data.type === "ERROR") {
        setError(event.data.message);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      iframe.removeEventListener("load", handleIframeLoad);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Toggle selection mode
  useEffect(() => {
    const iframe = document.getElementById(
      "selector-iframe",
    ) as HTMLIFrameElement;
    if (!iframe || !iframeLoaded) return;

    try {
      iframe.contentWindow?.postMessage(
        { type: "TOGGLE_SELECTION_MODE", enabled: selectionMode },
        "*",
      );
    } catch (err) {
      console.error("Error toggling selection mode:", err);
    }
  }, [selectionMode, iframeLoaded]);

  const addSelectedElement = (element: any) => {
    // Check if element is already selected
    const isAlreadySelected = selectedElements.some(
      (el) => el.path === element.path,
    );

    if (!isAlreadySelected) {
      setSelectedElements([...selectedElements, element]);
    }
  };

  const removeSelectedElement = (index: number) => {
    const newElements = [...selectedElements];
    newElements.splice(index, 1);
    setSelectedElements(newElements);
  };

  const handleSaveSelectors = () => {
    onSave(generatedSelectors);
  };

  const handleCategoryChange = (element: any, category: string) => {
    const updatedElements = selectedElements.map((el) => {
      if (el.path === element.path) {
        return { ...el, category };
      }
      return el;
    });
    setSelectedElements(updatedElements);
  };

  const generateSelectors = () => {
    const iframe = document.getElementById(
      "selector-iframe",
    ) as HTMLIFrameElement;
    if (!iframe || !iframeLoaded) return;

    try {
      iframe.contentWindow?.postMessage(
        {
          type: "GENERATE_SELECTORS",
          elements: selectedElements,
        },
        "*",
      );
    } catch (err) {
      console.error("Error generating selectors:", err);
      setError("Failed to generate selectors");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">Visual Selector Builder</h2>
        <div className="flex space-x-2">
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectionMode(!selectionMode)}
          >
            {selectionMode ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Exit Selection Mode
              </>
            ) : (
              <>
                <Crosshair className="mr-2 h-4 w-4" />
                Enter Selection Mode
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generateSelectors}
            disabled={selectedElements.length === 0}
          >
            <Code className="mr-2 h-4 w-4" />
            Generate Selectors
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveSelectors}
            disabled={Object.keys(generatedSelectors.css).length === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Selectors
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="w-2/3 h-full border-r">
          <div className="relative w-full h-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            <iframe
              id="selector-iframe"
              src={url}
              className="w-full h-full border-0"
              title="Website Preview"
              sandbox="allow-same-origin allow-scripts allow-forms"
              referrerPolicy="no-referrer"
              onLoad={() => setIsLoading(false)}
            ></iframe>
            {selectionMode && hoveredElement && (
              <div className="absolute bottom-4 left-4 right-4 bg-background border rounded-md p-2 shadow-lg">
                <div className="text-sm font-medium">
                  {hoveredElement.tagName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {hoveredElement.path}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-1/3 flex flex-col h-full">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1"
          >
            <div className="px-4 pt-4 border-b">
              <TabsList className="w-full">
                <TabsTrigger value="visual" className="flex-1">
                  <MousePointer className="mr-2 h-4 w-4" />
                  Selected Elements
                </TabsTrigger>
                <TabsTrigger value="selectors" className="flex-1">
                  <Layers className="mr-2 h-4 w-4" />
                  Generated Selectors
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="visual" className="flex-1 p-4 overflow-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Selected Elements ({selectedElements.length})
                  </h3>
                  {selectedElements.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedElements([])}
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {selectedElements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Crosshair className="h-12 w-12 text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium">
                      No elements selected
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter selection mode and click on elements to select them
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSelectionMode(true)}
                    >
                      <Crosshair className="mr-2 h-4 w-4" />
                      Enter Selection Mode
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="space-y-3">
                      {selectedElements.map((element, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="py-2 px-3">
                            <div className="flex justify-between items-center">
                              <Badge variant="outline">{element.tagName}</Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeSelectedElement(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="py-2 px-3">
                            <div className="text-xs text-muted-foreground mb-2 truncate">
                              {element.path}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">
                                Assign to Category:
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  "Services",
                                  "Fees",
                                  "Documents",
                                  "Eligibility",
                                ].map((category) => (
                                  <div
                                    key={category}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`category-${index}-${category}`}
                                      checked={element.category === category}
                                      onCheckedChange={() =>
                                        handleCategoryChange(element, category)
                                      }
                                    />
                                    <Label
                                      htmlFor={`category-${index}-${category}`}
                                      className="text-xs cursor-pointer"
                                    >
                                      {category}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            <TabsContent value="selectors" className="flex-1 p-4 overflow-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Generated Selectors</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSelectors}
                    disabled={selectedElements.length === 0}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </div>

                {Object.keys(generatedSelectors.css).length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <FileJson className="h-12 w-12 text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium">
                      No selectors generated
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select elements and click "Generate Selectors" to create
                      selectors
                    </p>
                    <Button
                      variant="outline"
                      onClick={generateSelectors}
                      disabled={selectedElements.length === 0}
                    >
                      <Code className="mr-2 h-4 w-4" />
                      Generate Selectors
                    </Button>
                  </div>
                ) : (
                  <Tabs defaultValue="css">
                    <TabsList className="w-full">
                      <TabsTrigger value="css">CSS Selectors</TabsTrigger>
                      <TabsTrigger value="xpath">XPath Selectors</TabsTrigger>
                    </TabsList>
                    <TabsContent value="css" className="mt-4">
                      <ScrollArea className="h-[calc(100vh-350px)]">
                        <div className="space-y-3">
                          {Object.entries(generatedSelectors.css).map(
                            ([category, selector], index) => (
                              <Card key={index}>
                                <CardHeader className="py-2 px-3">
                                  <CardTitle className="text-sm">
                                    {category}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="py-2 px-3">
                                  <div className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                                    {selector}
                                  </div>
                                </CardContent>
                              </Card>
                            ),
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="xpath" className="mt-4">
                      <ScrollArea className="h-[calc(100vh-350px)]">
                        <div className="space-y-3">
                          {Object.entries(generatedSelectors.xpath).map(
                            ([category, selector], index) => (
                              <Card key={index}>
                                <CardHeader className="py-2 px-3">
                                  <CardTitle className="text-sm">
                                    {category}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="py-2 px-3">
                                  <div className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                                    {selector}
                                  </div>
                                </CardContent>
                              </Card>
                            ),
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default VisualSelectorBuilder;
