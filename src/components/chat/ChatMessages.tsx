"use client";

import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Skeleton } from "../ui/skeleton";
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  category?: string;
  isLoading?: boolean;
  source?: {
    url: string;
    title: string;
  }[];
}

interface ChatMessagesProps {
  messages?: Message[];
  isTyping?: boolean;
  onFeedback?: (messageId: string, isPositive: boolean) => void;
  className?: string;
  aiName?: string;
  aiAvatarUrl?: string;
  userAvatarUrl?: string;
}

const ChatMessages = ({
  messages = [],

  isTyping = false,
  onFeedback = () => {},
  className = "",
  aiName = "AI Assistant",
  aiAvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=ai-assistant",
  userAvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
}: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<
    Record<string, "positive" | "negative" | null>
  >({});

  // Scroll to bottom when messages change
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is updated before scrolling
    const scrollTimeout = requestAnimationFrame(() => {
      scrollToBottom();
    });

    return () => cancelAnimationFrame(scrollTimeout);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    onFeedback(messageId, isPositive);
    setFeedbackGiven((prev) => ({
      ...prev,
      [messageId]: isPositive ? "positive" : "negative",
    }));
  };

  return (
    <div
      className={`flex flex-col h-full overflow-y-auto p-4 bg-background ${className}`}
    >
      <div className="flex-1 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <Avatar>
                  <AvatarImage
                    src={
                      message.sender === "user" ? userAvatarUrl : aiAvatarUrl
                    }
                    alt={message.sender === "user" ? "User" : aiName}
                  />
                  <AvatarFallback>
                    {message.sender === "user" ? "U" : "A"}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Message content */}
              <div
                className={`mx-2 p-3 rounded-lg ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {message.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="whitespace-pre-wrap">{message.content}</div>

                    {/* Source citations for AI messages */}
                    {message.sender === "ai" &&
                      message.source &&
                      message.source.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                          <p className="font-semibold">Sources:</p>
                          <ul className="list-disc list-inside">
                            {message.source.map((src, index) => (
                              <li key={index}>
                                <a
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {src.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* Category tag for AI messages */}
                    {message.sender === "ai" && message.category && (
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                          {message.category}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Message timestamp */}
                <div
                  className={`text-xs mt-1 ${
                    message.sender === "user"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {/* Message actions for AI messages */}
              {message.sender === "ai" && !message.isLoading && (
                <div className="flex flex-col space-y-1 justify-start">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            copyToClipboard(message.content, message.id)
                          }
                        >
                          {copiedMessageId === message.id ? (
                            <Check size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {copiedMessageId === message.id
                            ? "Copied!"
                            : "Copy message"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${feedbackGiven[message.id] === "positive" ? "text-green-500" : ""}`}
                          onClick={() => handleFeedback(message.id, true)}
                          disabled={feedbackGiven[message.id] !== undefined}
                        >
                          <ThumbsUp size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Helpful</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${feedbackGiven[message.id] === "negative" ? "text-red-500" : ""}`}
                          onClick={() => handleFeedback(message.id, false)}
                          disabled={feedbackGiven[message.id] !== undefined}
                        >
                          <ThumbsDown size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Not helpful</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex flex-row">
              <div className="flex-shrink-0">
                <Avatar>
                  <AvatarImage src={aiAvatarUrl} alt={aiName} />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
              </div>
              <div className="mx-2 p-3 rounded-lg bg-muted">
                <div className="flex space-x-1">
                  <div
                    className="h-2 w-2 rounded-full bg-foreground/60 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="h-2 w-2 rounded-full bg-foreground/60 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="h-2 w-2 rounded-full bg-foreground/60 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
