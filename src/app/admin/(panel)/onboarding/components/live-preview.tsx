"use client";

import { useState, useRef } from "react";
import { ExternalLink, Smartphone, Monitor, Tablet } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

type ViewMode = "desktop" | "tablet" | "mobile";

interface LivePreviewProps {
  businessSlug: string;
  isActive: boolean;
  refreshToken?: number;
}

const VIEW_SIZES = {
  desktop: { width: "100%", height: "100%" },
  tablet: { width: "768px", height: "100%" },
  mobile: { width: "375px", height: "100%" },
};

export function LivePreview({ businessSlug, isActive, refreshToken = 0 }: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [manualRefreshCount, setManualRefreshCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const size = VIEW_SIZES[viewMode];
  const iframeKey = `${businessSlug}:${refreshToken}:${manualRefreshCount}`;

  if (!isActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-2xl bg-secondary/20">
        <div className="size-12 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Monitor className="size-6 text-muted-foreground" />
        </div>
        <h4 className="font-medium text-foreground mb-1">
          Preview no disponible
        </h4>
        <p className="text-sm text-muted-foreground">
          Completa el primer paso para ver la preview de tu página
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode("desktop")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "desktop"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Vista desktop"
          >
            <Monitor className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("tablet")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "tablet"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Vista tablet"
          >
            <Tablet className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("mobile")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "mobile"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Vista mobile"
          >
            <Smartphone className="size-4" />
          </button>
        </div>

        <Link
          href={`/${businessSlug}`}
          target="_blank"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 gap-1.5"
          )}
        >
          <ExternalLink className="size-3.5" />
          <span className="hidden sm:inline">Abrir</span>
        </Link>
      </div>

      {/* Preview Frame */}
      <div 
        ref={containerRef}
        className="flex-1 bg-secondary/30 rounded-xl border border-border overflow-hidden"
      >
        <div 
          className="w-full h-full overflow-auto flex justify-center"
          style={{ 
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: size.width,
              height: size.height,
              minWidth: viewMode === "desktop" ? "100%" : size.width,
              transition: "width 0.3s ease, min-width 0.3s ease",
            }}
          >
            <iframe
              key={iframeKey}
              src={`/${businessSlug}`}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                background: "white",
              }}
              title="Preview de página pública"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      </div>

      {/* Refrescar */}
      <button
        type="button"
        onClick={() => setManualRefreshCount((count) => count + 1)}
        className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
      >
        Refrescar preview
      </button>
    </div>
  );
}
