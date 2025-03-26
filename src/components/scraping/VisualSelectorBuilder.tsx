"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Copy,
  Download,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input as InputWithButton } from "@/components/ui/input";

interface VisualSelectorBuilderProps {
  url: string;
  onSave?: (selectors: any) => void;
  onClose?: () => void;
  initialCategories?: string[];
}

interface ElementData {
  tagName: string;
  path: string;
  attributes: Record<string, string>;
  innerText?: string;
  category?: string;
  customEntity?: string;
}

const VisualSelectorBuilder: React.FC<VisualSelectorBuilderProps> = ({
  url,
  onSave = () => {},
  onClose = () => {},
  initialCategories = ["Services", "Fees", "Documents", "Eligibility"],
}) => {
  const [activeTab, setActiveTab] = useState("visual");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedElements, setSelectedElements] = useState<ElementData[]>([]);
  const [hoveredElement, setHoveredElement] = useState<ElementData | null>(
    null,
  );
  const [generatedSelectors, setGeneratedSelectors] = useState<any>({
    css: {},
    xpath: {},
  });
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [newCategory, setNewCategory] = useState("");
  const [customEntities, setCustomEntities] = useState<string[]>([]);
  const [newEntity, setNewEntity] = useState("");
  const [selectorType, setSelectorType] = useState<"css" | "xpath">("css");
  const [copiedSelector, setCopiedSelector] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize iframe and messaging
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      setIframeLoaded(true);
      setIsLoading(false);

      try {
        // Initialize the selector tool in the iframe
        const script = document.createElement("script");
        script.textContent = `
          // Selector tool initialization
          (function() {
            let selectionModeEnabled = false;
            let highlightedElement = null;
            let highlightOverlay = null;
            
            // Create highlight overlay
            function createHighlightOverlay() {
              highlightOverlay = document.createElement('div');
              highlightOverlay.style.position = 'absolute';
              highlightOverlay.style.border = '2px solid #3b82f6';
              highlightOverlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              highlightOverlay.style.pointerEvents = 'none';
              highlightOverlay.style.zIndex = '9999';
              highlightOverlay.style.display = 'none';
              document.body.appendChild(highlightOverlay);
            }
            
            // Update highlight position
            function updateHighlightPosition(element) {
              if (!highlightOverlay) return;
              const rect = element.getBoundingClientRect();
              highlightOverlay.style.top = rect.top + window.scrollY + 'px';
              highlightOverlay.style.left = rect.left + window.scrollX + 'px';
              highlightOverlay.style.width = rect.width + 'px';
              highlightOverlay.style.height = rect.height + 'px';
              highlightOverlay.style.display = 'block';
            }
            
            // Get element path
            function getElementPath(element) {
              let path = '';
              while (element && element.nodeType === Node.ELEMENT_NODE) {
                let selector = element.nodeName.toLowerCase();
                if (element.id) {
                  selector += '#' + element.id;
                } else {
                  let sibling = element;
                  let siblingIndex = 1;
                  while (sibling = sibling.previousElementSibling) {
                    if (sibling.nodeName === element.nodeName) {
                      siblingIndex++;
                    }
                  }
                  if (element.previousElementSibling || element.nextElementSibling) {
                    selector += ':nth-child(' + siblingIndex + ')';
                  }
                }
                path = selector + (path ? ' > ' + path : '');
                element = element.parentNode as Element;
              }
              return path;
            }
            
            // Get element XPath
            function getElementXPath(element) {
              if (!element) return '';
              if (element.id) return '//*[@id="' + element.id + '"]';
              
              let path = '';
              let current = element;
              while (current && current.nodeType === Node.ELEMENT_NODE) {
                let index = 0;
                let sibling = current;
                while (sibling) {
                  if (sibling.nodeName === current.nodeName) {
                    index++;
                  }
                  sibling = sibling.previousElementSibling;
                }
                
                const tagName = current.nodeName.toLowerCase();
                const pathIndex = index > 1 ? '[' + index + ']' : '';
                path = '/' + tagName + pathIndex + path;
                current = current.parentNode as Element;
              }
              
              return path;
            }
            
            // Get element attributes
            function getElementAttributes(element) {
              const attributes = {};
              for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                attributes[attr.name] = attr.value;
              }
              return attributes;
            }
            
            // Handle mouseover
            function handleMouseOver(event) {
              if (!selectionModeEnabled) return;
              event.stopPropagation();
              
              highlightedElement = event.target;
              updateHighlightPosition(highlightedElement);
              
              // Send element data to parent
              window.parent.postMessage({
                type: 'ELEMENT_HOVERED',
                element: {
                  tagName: highlightedElement.tagName,
                  path: getElementPath(highlightedElement),
                  xpath: getElementXPath(highlightedElement),
                  attributes: getElementAttributes(highlightedElement),
                  innerText: highlightedElement.innerText?.substring(0, 100)
                }
              }, '*');
            }
            
            // Handle click
            function handleClick(event) {
              if (!selectionModeEnabled) return;
              event.preventDefault();
              event.stopPropagation();
              
              // Send selected element to parent
              window.parent.postMessage({
                type: 'ELEMENT_SELECTED',
                element: {
                  tagName: event.target.tagName,
                  path: getElementPath(event.target),
                  xpath: getElementXPath(event.target),
                  attributes: getElementAttributes(event.target),
                  innerText: event.target.innerText?.substring(0, 100)
                }
              }, '*');
            }
            
            // Generate CSS selector
            function generateCssSelector(element) {
              if (!element) return '';
              if (element.id) return '#' + element.id;
              
              let selector = element.tagName.toLowerCase();
              if (element.className) {
                const classes = element.className.split(' ').filter(c => c.trim());
                if (classes.length > 0) {
                  selector += '.' + classes.join('.');
                }
              }
              
              // Add attribute selectors for data attributes
              for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                if (attr.name.startsWith('data-') && attr.value) {
                  selector += '[' + attr.name + '="' + attr.value + '"]';
                  break; // Just add one data attribute to keep it simple
                }
              }
              
              return selector;
            }
            
            // Generate selectors for categories
            function generateSelectors(elements) {
              const cssSelectors = {};
              const xpathSelectors = {};
              
              // Group elements by category
              const categorizedElements = {};
              elements.forEach(element => {
                if (!element.category) return;
                if (!categorizedElements[element.category]) {
                  categorizedElements[element.category] = [];
                }
                categorizedElements[element.category].push(element);
              });
              
              // Generate selectors for each category
              for (const category in categorizedElements) {
                const categoryElements = categorizedElements[category];
                if (categoryElements.length === 0) continue;
                
                // For CSS selectors
                if (categoryElements.length === 1) {
                  // Single element selector
                  const el = document.querySelector(categoryElements[0].path);
                  cssSelectors[category] = generateCssSelector(el);
                } else {
                  // Multiple elements selector
                  const commonParent = findCommonParent(categoryElements.map(e => e.path));
                  const el = document.querySelector(commonParent);
                  if (el) {
                    cssSelectors[category] = generateCssSelector(el) + ' ' + 
                      categoryElements[0].path.split(' > ').pop();
                  } else {
                    cssSelectors[category] = categoryElements[0].path;
                  }
                }
                
                // For XPath selectors
                if (categoryElements.length === 1) {
                  xpathSelectors[category] = categoryElements[0].xpath;
                } else {
                  // Create a union of XPaths
                  xpathSelectors[category] = categoryElements.map(e => e.xpath).join(' | ');
                }
              }
              
              return { css: cssSelectors, xpath: xpathSelectors };
            }
            
            // Find common parent path
            function findCommonParent(paths) {
              if (paths.length === 0) return '';
              if (paths.length === 1) return paths[0];
              
              const splitPaths = paths.map(p => p.split(' > '));
              let commonPath = [];
              
              for (let i = 0; i < splitPaths[0].length; i++) {
                const segment = splitPaths[0][i];
                let isCommon = true;
                
                for (let j = 1; j < splitPaths.length; j++) {
                  if (i >= splitPaths[j].length || splitPaths[j][i] !== segment) {
                    isCommon = false;
                    break;
                  }
                }
                
                if (isCommon) {
                  commonPath.push(segment);
                } else {
                  break;
                }
              }
              
              return commonPath.join(' > ');
            }
            
            // Initialize
            createHighlightOverlay();
            
            // Listen for messages from parent
            window.addEventListener('message', function(event) {
              if (event.data.type === 'TOGGLE_SELECTION_MODE') {
                selectionModeEnabled = event.data.enabled;
                if (!selectionModeEnabled && highlightOverlay) {
                  highlightOverlay.style.display = 'none';
                }
              } else if (event.data.type === 'GENERATE_SELECTORS') {
                const selectors = generateSelectors(event.data.elements);
                window.parent.postMessage({
                  type: 'SELECTORS_GENERATED',
                  selectors: selectors
                }, '*');
              }
            });
            
            // Add event listeners
            document.addEventListener('mouseover', handleMouseOver, true);
            document.addEventListener('click', handleClick, true);
            
            // Notify parent that we're ready
            window.parent.postMessage({ type: 'SELECTOR_TOOL_READY' }, '*');
          })();
        `;

        iframe.contentWindow?.document.body.appendChild(script);
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
      } else if (event.data.type === "SELECTOR_TOOL_READY") {
        console.log("Selector tool is ready");
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
    const iframe = iframeRef.current;
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

  const addSelectedElement = (element: ElementData) => {
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
    // Prepare the selectors with additional metadata
    const enhancedSelectors = {
      css: { ...generatedSelectors.css },
      xpath: { ...generatedSelectors.xpath },
      elements: selectedElements,
      categories: categories,
      customEntities: customEntities,
      timestamp: new Date().toISOString(),
      url: url,
    };

    onSave(enhancedSelectors);
  };

  const handleCategoryChange = (element: ElementData, category: string) => {
    const updatedElements = selectedElements.map((el) => {
      if (el.path === element.path) {
        return { ...el, category };
      }
      return el;
    });
    setSelectedElements(updatedElements);
  };

  const handleEntityChange = (element: ElementData, entity: string) => {
    const updatedElements = selectedElements.map((el) => {
      if (el.path === element.path) {
        return { ...el, customEntity: entity };
      }
      return el;
    });
    setSelectedElements(updatedElements);
  };

  const generateSelectors = () => {
    const iframe = iframeRef.current;
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

  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
    // Also update any elements that had this category
    setSelectedElements(
      selectedElements.map((el) => {
        if (el.category === category) {
          return { ...el, category: undefined };
        }
        return el;
      }),
    );
  };

  const addEntity = () => {
    if (newEntity && !customEntities.includes(newEntity)) {
      setCustomEntities([...customEntities, newEntity]);
      setNewEntity("");
    }
  };

  const removeEntity = (entity: string) => {
    setCustomEntities(customEntities.filter((e) => e !== entity));
    // Also update any elements that had this entity
    setSelectedElements(
      selectedElements.map((el) => {
        if (el.customEntity === entity) {
          return { ...el, customEntity: undefined };
        }
        return el;
      }),
    );
  };

  const handleCopySelector = (selector: string) => {
    navigator.clipboard.writeText(selector);
    setCopiedSelector(selector);
    setTimeout(() => setCopiedSelector(null), 2000);
  };

  const handleDownloadSelectors = () => {
    const data = {
      selectors: generatedSelectors,
      elements: selectedElements,
      categories: categories,
      customEntities: customEntities,
      url: url,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selectors-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSelectors}
                  disabled={Object.keys(generatedSelectors.css).length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download selectors as JSON</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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

      {showInstructions && (
        <Alert className="m-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium mb-1">
                How to use the Visual Selector Builder:
              </h3>
              <ol className="text-sm list-decimal pl-5 space-y-1">
                <li>
                  Click "Enter Selection Mode" to start selecting elements
                </li>
                <li>Hover over elements on the page to highlight them</li>
                <li>Click on elements to select them</li>
                <li>
                  Assign categories or custom entities to selected elements
                </li>
                <li>
                  Click "Generate Selectors" to create CSS and XPath selectors
                </li>
                <li>Click "Save Selectors" when you're done</li>
              </ol>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstructions(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
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
              ref={iframeRef}
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
                {hoveredElement.innerText && (
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    Text: {hoveredElement.innerText}
                  </div>
                )}
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
                <TabsTrigger value="categories" className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  Categories & Entities
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
                            {element.innerText && (
                              <div className="text-xs text-muted-foreground mb-2 truncate">
                                Text: {element.innerText}
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label className="text-xs">
                                Assign to Category:
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                {categories.map((category) => (
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

                              {customEntities.length > 0 && (
                                <>
                                  <Label className="text-xs mt-3">
                                    Assign to Entity:
                                  </Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {customEntities.map((entity) => (
                                      <div
                                        key={entity}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={`entity-${index}-${entity}`}
                                          checked={
                                            element.customEntity === entity
                                          }
                                          onCheckedChange={() =>
                                            handleEntityChange(element, entity)
                                          }
                                        />
                                        <Label
                                          htmlFor={`entity-${index}-${entity}`}
                                          className="text-xs cursor-pointer"
                                        >
                                          {entity}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
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
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateSelectors}
                      disabled={selectedElements.length === 0}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                    <Tabs
                      value={selectorType}
                      onValueChange={(value: any) => setSelectorType(value)}
                      className="w-[180px]"
                    >
                      <TabsList className="w-full">
                        <TabsTrigger value="css">CSS</TabsTrigger>
                        <TabsTrigger value="xpath">XPath</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                {Object.keys(generatedSelectors[selectorType]).length === 0 ? (
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
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    <div className="space-y-3">
                      {Object.entries(generatedSelectors[selectorType]).map(
                        ([category, selector], index) => (
                          <Card key={index}>
                            <CardHeader className="py-2 px-3">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-sm">
                                  {category}
                                </CardTitle>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() =>
                                          handleCopySelector(selector as string)
                                        }
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {copiedSelector === selector
                                        ? "Copied!"
                                        : "Copy selector"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </CardHeader>
                            <CardContent className="py-2 px-3">
                              <div className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                                {selector as string}
                              </div>
                            </CardContent>
                          </Card>
                        ),
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="categories"
              className="flex-1 p-4 overflow-auto"
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Categories</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <Input
                      placeholder="Add new category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCategory}
                      disabled={
                        !newCategory || categories.includes(newCategory)
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <span>{category}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeCategory(category)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No categories defined. Add some categories to organize
                        your selectors.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Custom Entities</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <Input
                      placeholder="Add new entity (e.g., price, title)"
                      value={newEntity}
                      onChange={(e) => setNewEntity(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addEntity}
                      disabled={
                        !newEntity || customEntities.includes(newEntity)
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {customEntities.map((entity) => (
                      <div
                        key={entity}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <span>{entity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeEntity(entity)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {customEntities.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No custom entities defined. Add entities to extract
                        specific data types like prices, titles, etc.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default VisualSelectorBuilder;
