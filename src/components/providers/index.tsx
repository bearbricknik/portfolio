"use client";

import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

import { QueryProvider } from "./query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <TooltipProvider>
        <Toaster>{children}</Toaster>
      </TooltipProvider>
    </QueryProvider>
  );
}
