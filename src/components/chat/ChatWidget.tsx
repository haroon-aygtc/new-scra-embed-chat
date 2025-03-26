"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import { cn } from "@/lib/utils";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { Button } from "../ui/button";
import { MessageCircle, X } from "lucide-react";

interface ChatWidgetProps {
  title?: string;
  aiName?: string;
  aiAvatarUrl?: string;
  userAvatarUrl?: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  initiallyOpen?: boolean;
  initiallyMaximized?: boolean;
  theme?: "light" | "dark" | "system";
  allowDragging?: boolean;
  allowResizing?: boolean;
  allowMinimize?: boolean;
  allowMaximize?: boolean;
  allowClose?: boolean;
  zIndex?: number;
  onSendMessage?: (message: string) => void;
  onClose?: () => void;
  className?: string;
}

const ChatWidget = ({
  title = "AI Assistant",
  aiName = "AI Assistant",
  aiAvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=ai-assistant",
  userAvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
  initialPosition = { x: 20, y: 20 },
  initialSize = { width: 350, height: 500 },
  initiallyOpen = true,
  initiallyMaximized = false,
  theme = "system",
  allowDragging = true,
  allowResizing = true,
  allowMinimize = true,
  allowMaximize = true,
  allowClose = true,
  zIndex = 1000,
  onSendMessage = () => {},
  onClose = () => {},
  className = "",
}: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [isMaximized, setIsMaximized] = useState(initiallyMaximized);
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [prevSize, setPrevSize] = useState(initialSize);
  const [prevPosition, setPrevPosition] = useState(initialPosition);
  const [messages, setMessages] = useState([
    {
      id: "1",
      content: "Hello! How can I help you today?",
      sender: "ai" as const,
      timestamp: new Date(),
      category: "greeting",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Apply theme
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System theme follows user preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  // Handle window resize for maximized state
  useEffect(() => {
    if (!isMounted) return;

    const handleResize = () => {
      if (isMaximized) {
        setSize({
          width: window.innerWidth - 40,
          height: window.innerHeight - 40,
        });
        setPosition({ x: 20, y: 20 });
      }
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
  }, [isMaximized, isMounted]);

  const handleSendMessage = (message: string) => {
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: message,
      sender: "user" as const,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI typing
    setIsTyping(true);

    // Call the provided onSendMessage callback
    onSendMessage(message);

    // Simulate AI response after a delay
    setTimeout(() => {
      setIsTyping(false);
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: `I received your message: "${message}". This is a simulated response from the AI assistant.`,
        sender: "ai" as const,
        timestamp: new Date(),
        category: "response",
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1500);
  };

  const handleToggleMaximize = () => {
    if (!isMaximized) {
      // Save current size and position before maximizing
      setPrevSize(size);
      setPrevPosition(position);

      // Maximize
      setIsMaximized(true);
      setSize({
        width: window.innerWidth - 40,
        height: window.innerHeight - 40,
      });
      setPosition({ x: 20, y: 20 });
    } else {
      // Restore previous size and position
      setIsMaximized(false);
      setSize(prevSize);
      setPosition(prevPosition);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleMinimize = () => {
    setIsOpen(false);
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    console.log(
      `Feedback for message ${messageId}: ${isPositive ? "positive" : "negative"}`,
    );
    // Here you would typically send this feedback to your backend
  };

  // Widget toggle button (shown when chat is minimized)
  const renderToggleButton = () => (
    <Button
      className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg"
      onClick={() => setIsOpen(true)}
      style={{ zIndex }}
    >
      <MessageCircle size={24} />
    </Button>
  );

  // Main chat widget
  const renderChatWidget = () => {
    const widgetContent = (
      <div
        className={cn(
          "flex flex-col h-full w-full overflow-hidden rounded-lg shadow-xl bg-background border",
          className,
        )}
        style={{ zIndex }}
        ref={widgetRef}
      >
        <ChatHeader
          title={title}
          onClose={allowClose ? handleClose : undefined}
          onMinimize={allowMinimize ? handleMinimize : undefined}
          onMaximize={allowMaximize ? handleToggleMaximize : undefined}
          isMaximized={isMaximized}
          isDraggable={allowDragging && !isMaximized}
        />

        <div className="flex-1 overflow-hidden">
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            onFeedback={handleFeedback}
            aiName={aiName}
            aiAvatarUrl={aiAvatarUrl}
            userAvatarUrl={userAvatarUrl}
          />
        </div>

        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    );

    // If maximized or not draggable/resizable, render without Rnd
    if (isMaximized || (!allowDragging && !allowResizing)) {
      return (
        <div
          className="fixed"
          style={{
            top: position.y,
            left: position.x,
            width: size.width,
            height: size.height,
            zIndex,
          }}
        >
          {widgetContent}
        </div>
      );
    }

    // Otherwise render with Rnd for dragging and resizing
    return (
      <Rnd
        position={position}
        size={size}
        onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
        onResizeStop={(e, direction, ref, delta, position) => {
          setSize({
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
          });
          setPosition(position);
        }}
        minWidth={300}
        minHeight={400}
        bounds="window"
        dragHandleClassName="data-drag-handle"
        disableDragging={!allowDragging}
        enableResizing={allowResizing}
        style={{ zIndex }}
      >
        {widgetContent}
      </Rnd>
    );
  };

  // Don't render anything on the server
  if (!isMounted) return null;

  // Use createPortal to render the widget at the root level of the DOM
  return createPortal(
    <>
      {!isOpen && renderToggleButton()}
      {isOpen && renderChatWidget()}
    </>,
    document.body,
  );
};

export default ChatWidget;
