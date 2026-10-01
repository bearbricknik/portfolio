"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { IconChevronDownSmall } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/i18n/config";
import { CATEGORY_ICON } from "@/lib/blog";
import { blogCategoriesOptions } from "@/lib/blog-queries";

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
 * Category dropdown: the current category's icon and name; in the menu each
 * category with its number of posts and a check on the selected one
 */
export function CategoryFilter({ labels }: CategoryFilterProps) {
  const { filter, setFilter } = useBlogFilter();
  const locale = useLocale() as Locale;
  const { data: categories } = useSuspenseQuery(blogCategoriesOptions(locale));
  // Every post has exactly one category
  const total = categories.reduce((sum, category) => sum + category.count, 0);
  const options = [
    { key: ALL, icon: "all", title: labels.all, count: total },
    // Empty categories have nothing to show
    ...categories.filter((category) => category.count > 0),
  ];
  const current = options.find((option) => option.key === filter) ?? options[0];
  const CurrentIcon = CATEGORY_ICON[current.icon] ?? CATEGORY_ICON.all;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={labels.filter}
        data-cursor="pointer"
        className="group/filter inline-flex items-center gap-1.5 rounded-lg border py-1 pr-1.5 pl-2 text-sm leading-none text-muted-foreground transition-colors outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-muted/60 data-popup-open:text-foreground"
      >
        <CurrentIcon className="size-3.5 text-foreground" />
        {current.title}
        <IconChevronDownSmall className="size-3.5 transition-transform duration-300 group-data-popup-open/filter:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        <DropdownMenuRadioGroup value={filter} onValueChange={(value) => setFilter(value as string)}>
          {options.map((option, index) => {
            const Icon = CATEGORY_ICON[option.icon] ?? CATEGORY_ICON.all;
            return (
              <div key={option.key} className="contents">
                {/* "All" stands apart from the categories */}
                {index === 1 && <DropdownMenuSeparator />}
                <DropdownMenuRadioItem value={option.key} closeOnClick>
                  <Icon className="size-3.5 text-muted-foreground" />
                  <span className="flex-1">{option.title}</span>
                  <span className="text-xs text-muted-foreground">{option.count}</span>
                </DropdownMenuRadioItem>
              </div>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
