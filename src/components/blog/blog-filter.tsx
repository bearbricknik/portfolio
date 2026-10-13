"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import type { Locale } from "@/i18n/config";
import { blogCategoriesOptions } from "@/lib/blog-queries";
import { cn } from "@/lib/utils";

/** "all" or a category key */
export const ALL = "all";

type BlogFilterContextValue = { filter: string; setFilter: (filter: string) => void };

const BlogFilterContext = createContext<BlogFilterContextValue | null>(null);

/**
 * Shares the selected category between the filter (next to the page heading)
 * and the posts further down the page
 */
export function BlogFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState(ALL);
  const value = useMemo(() => ({ filter, setFilter }), [filter]);
  return <BlogFilterContext.Provider value={value}>{children}</BlogFilterContext.Provider>;
}

export function useBlogFilter() {
  const context = useContext(BlogFilterContext);
  if (!context) throw new Error("useBlogFilter needs a BlogFilterProvider around it");
  return context;
}

type CategoryFilterProps = {
  labels: { all: string; filter: string };
};

/**
 * The categories as a row of text tabs, each with its number of posts; the
 * selected one in the text color. Empty categories aren't shown.
 */
export function CategoryFilter({ labels }: CategoryFilterProps) {
  const { filter, setFilter } = useBlogFilter();
  const locale = useLocale() as Locale;
  const { data: categories } = useSuspenseQuery(blogCategoriesOptions(locale));
  // Every post has exactly one category
  const total = categories.reduce((sum, category) => sum + category.count, 0);
  const options = [
    { key: ALL, title: labels.all, count: total },
    ...categories.filter((category) => category.count > 0),
  ];

  return (
    <div role="group" aria-label={labels.filter} className="flex flex-wrap gap-x-3.5 gap-y-1 text-sm">
      {options.map((option) => {
        const selected = option.key === filter;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={selected}
            data-cursor="pointer"
            onClick={() => setFilter(option.key)}
            className={cn(
              "inline-flex items-baseline gap-1 rounded-sm text-muted-foreground transition-colors duration-200 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
              selected && "text-foreground",
            )}
          >
            {option.title}
            <sup className="text-[0.625rem] text-muted-foreground/70 tabular-nums">{option.count}</sup>
          </button>
        );
      })}
    </div>
  );
}
