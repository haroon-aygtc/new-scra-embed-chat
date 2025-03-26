"use client";

import React from "react";
import { Button } from "../ui/button";
import { X, Minimize, Maximize, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  title?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  isDraggable?: boolean;
  className?: string;
}

const ChatHeader = ({
  title = "AI Assistant",
  onClose = () => {},
  onMinimize = () => {},
  onMaximize = () => {},
  isMaximized = false,
  isDraggable = true,
  className,
}: ChatHeaderProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground rounded-t-lg",
        className,
      )}
    >
      {isDraggable && (
        <div className="cursor-move mr-2" data-drag-handle>
          <GripVertical size={16} />
        </div>
      )}

      <div className="flex-1 font-medium truncate">{title}</div>

      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-primary-foreground/20"
          onClick={onMinimize}
          aria-label="Minimize chat"
        >
          <Minimize size={14} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-primary-foreground/20"
          onClick={onMaximize}
          aria-label={isMaximized ? "Restore chat" : "Maximize chat"}
        >
          <Maximize size={14} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-primary-foreground/20"
          onClick={onClose}
          aria-label="Close chat"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
