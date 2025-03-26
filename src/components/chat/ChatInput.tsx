"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Send, Paperclip, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowAttachments?: boolean;
  allowVoice?: boolean;
  className?: string;
}

const ChatInput = ({
  onSendMessage = () => {},
  placeholder = "Type your message here...",
  disabled = false,
  allowAttachments = true,
  allowVoice = true,
  className = "",
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
      // Focus back on textarea after sending
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter without Shift key
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "40px";
          const scrollHeight = textareaRef.current.scrollHeight;
          textareaRef.current.style.height = `${scrollHeight}px`;
        }
      });
    }
  }, [message]);

  return (
    <div
      className={cn(
        "flex flex-col w-full bg-background border-t p-2",
        className,
      )}
    >
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[40px] max-h-[120px] resize-none py-2 px-3 rounded-lg flex-1"
        />
        <div className="flex gap-1">
          {allowAttachments && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="rounded-full"
              disabled={disabled}
              aria-label="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          )}
          {allowVoice && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="rounded-full"
              disabled={disabled}
              aria-label="Voice input"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            disabled={disabled || !message.trim()}
            onClick={handleSendMessage}
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
