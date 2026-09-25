"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";

interface ResizablePanelGroupProps
  extends Omit<React.ComponentProps<typeof Group>, "orientation"> {
  direction?: "horizontal" | "vertical";
  orientation?: "horizontal" | "vertical";
}

const ResizablePanelGroup = ({
  className,
  direction = "horizontal",
  orientation,
  ...props
}: ResizablePanelGroupProps) => (
  <Group
    orientation={orientation || direction}
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
);

const normalizeSize = (size?: number | string) => {
  if (size === undefined || size === null) return undefined;
  if (typeof size === "number") {
    // In shadcn conventions, numbers <= 100 represent percentage (0..100%)
    return size <= 100 ? `${size}%` : `${size}px`;
  }
  return size;
};

interface ResizablePanelProps
  extends Omit<React.ComponentProps<typeof Panel>, "defaultSize" | "minSize" | "maxSize"> {
  defaultSize?: number | string;
  minSize?: number | string;
  maxSize?: number | string;
}

const ResizablePanel = ({
  defaultSize,
  minSize,
  maxSize,
  className,
  ...props
}: ResizablePanelProps) => (
  <Panel
    defaultSize={normalizeSize(defaultSize) as any}
    minSize={normalizeSize(minSize) as any}
    maxSize={normalizeSize(maxSize) as any}
    className={cn("min-w-0 overflow-hidden", className)}
    {...props}
  />
);

interface ResizableHandleProps
  extends React.ComponentProps<typeof Separator> {
  withHandle?: boolean;
}

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: ResizableHandleProps) => (
  <Separator
    className={cn(
      "relative flex w-px items-center justify-center bg-border transition-colors hover:bg-emerald-500/50 cursor-col-resize select-none after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=vertical]:cursor-row-resize",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-6 w-3.5 items-center justify-center rounded-xs border border-border bg-card shadow-2xs">
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
    )}
  </Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
