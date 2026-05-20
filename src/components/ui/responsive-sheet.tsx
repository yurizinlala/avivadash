"use client";

import * as React from "react";
import { SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type ResponsiveSheetContentProps = React.ComponentProps<typeof SheetContent>;

export function ResponsiveSheetContent({
  className,
  children,
  ...props
}: ResponsiveSheetContentProps) {
  return (
    <SheetContent
      side="right"
      className={cn(
        className,
        "responsive-sheet-content"
      )}
      {...props}
    >
      {children}
    </SheetContent>
  );
}
