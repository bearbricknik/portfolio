import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { defineField, defineType, type SlugSourceFn } from "sanity";

import { type Locale, locales } from "@/i18n/config";
import { requirePrimaryLanguage } from "@/sanity/languages";

type Translated<T> = { language: string; value?: T }[] | undefined;
const inLanguage = <T,>(value: Translated<T>, language: string) => value?.find((item) => item.language === language)?.value;

// Each language's slug is generated from that language's title
const slugFromTitle =
  (language: Locale): SlugSourceFn =>
  (document) =>
    inLanguage(document.title as Translated<string>, language) ?? "";

/**
 * A blog post. One document for both languages: the texts are translated
 * fields, everything else (category, dates, cover) exists once. Each language
 * has its own slug: /blog/<slug-de> and /blog/<slug-en>.
 * Created and updated times come from Sanity (_createdAt, _updatedAt).
 */
export const post = defineType({
  name: "post",
  title: "Beitrag",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    { name: "content", title: "Inhalt", default: true },
    { name: "meta", title: "Einordnung" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Titel",
      type: "internationalizedArrayString",
      group: "content",
      validation: (rule) => rule.custom(requirePrimaryLanguage),
    }),
    defineField({
      name: "slug",
      title: "Adresse",
      description: "huberdominik.com/blog/<slug>, eine pro Sprache",
      type: "object",
      group: "meta",
      options: { columns: 2 },
      fields: locales.map((language) =>
        defineField({
          name: language,
          title: language.toUpperCase(),
          type: "slug",
          options: { source: slugFromTitle(language), maxLength: 96 },
          // The German address is required; English only once there's an English title
          validation: (rule) =>
            rule.custom((value, context) => {
              const hasTitle = Boolean(inLanguage((context.document?.title as Translated<string>), language));
              if (language === "de" && !value?.current) return "Pflichtfeld";
              if (hasTitle && !value?.current) return "Für diese Sprache gibt es einen Titel, aber keine Adresse";
              return true;
            }),
        }),
      ),
    }),
    defineField({
      name: "category",
      title: "Kategorie",
      type: "reference",
      to: [{ type: "category" }],
      group: "meta",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Veröffentlicht am",
      description: "Wird angezeigt und bestimmt die Reihenfolge",
      type: "datetime",
      group: "meta",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "pinned",
      title: "Angeheftet",
      description: "Steht in der Übersicht oben, mit Pin",
      type: "boolean",
      group: "meta",
      initialValue: false,
    }),
    defineField({
      // Every post has a cover: in the overview and on the post page (16:10)
      name: "cover",
      title: "Titelbild",
      type: "image",
      group: "content",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Bildbeschreibung",
          type: "internationalizedArrayString",
          validation: (rule) => rule.custom(requirePrimaryLanguage),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Kurzfassung",
      description: "Ein bis zwei Sätze: Anfang der Beitragsseite und Vorschau beim Teilen",
      type: "internationalizedArrayText",
      group: "content",
      validation: (rule) => rule.custom(requirePrimaryLanguage),
    }),
    defineField({
      name: "body",
      title: "Text",
      type: "internationalizedArrayBlockContent",
      group: "content",
      validation: (rule) => rule.custom(requirePrimaryLanguage),
    }),
  ],
  orderings: [{ title: "Neueste zuerst", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: {
    select: { title: "title", category: "category.title", media: "cover", pinned: "pinned", publishedAt: "publishedAt" },
    prepare: ({ title, category, media, pinned, publishedAt }) => ({
      title: inLanguage(title as Translated<string>, "de") ?? "Ohne Titel",
      subtitle: [
        inLanguage(category as Translated<string>, "de"),
        publishedAt && new Date(publishedAt).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" }),
        pinned && "angeheftet",
      ]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});
