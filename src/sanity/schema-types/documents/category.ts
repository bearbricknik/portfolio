import { TagIcon } from "@sanity/icons/Tag";
import { defineField, defineType } from "sanity";

import { requirePrimaryLanguage } from "@/sanity/languages";

/** Icons a category can use (the site maps each key to its icon) */
export const CATEGORY_ICONS = [
  { title: "Ordner (Projekte)", value: "folder" },
  { title: "Code (Open Source)", value: "code" },
  { title: "Tasse (Lifestyle)", value: "coffee" },
] as const;

/** A blog category: the filter and the label on every card */
export const category = defineType({
  name: "category",
  title: "Kategorie",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "title",
      title: "Name",
      type: "internationalizedArrayString",
      validation: (rule) => rule.custom(requirePrimaryLanguage),
    }),
    defineField({
      name: "key",
      title: "Schlüssel",
      description: "Bleibt gleich, auch wenn sich der Name ändert (z. B. für den Filter)",
      type: "slug",
      options: { source: (doc) => (doc.title as { language: string; value: string }[] | undefined)?.find((t) => t.language === "en")?.value ?? "" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      options: { list: [...CATEGORY_ICONS], layout: "radio" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Reihenfolge",
      description: "Kleinere Zahl steht im Filter weiter oben",
      type: "number",
      initialValue: 0,
    }),
  ],
  orderings: [{ title: "Reihenfolge", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "title", key: "key.current" },
    prepare: ({ title, key }) => ({
      title: (title as { language: string; value: string }[] | undefined)?.find((t) => t.language === "de")?.value ?? key,
      subtitle: key,
    }),
  },
});
