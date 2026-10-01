import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { defineArrayMember, defineField, defineType } from "sanity";

/** Categories of the blog's filter; the labels on the site come from the messages */
export const POST_CATEGORIES = [
  { title: "Projekte", value: "projects" },
  { title: "Open Source", value: "openSource" },
  { title: "Lifestyle", value: "lifestyle" },
] as const;

/** A blog post at /blog/<slug> */
export const post = defineType({
  name: "post",
  title: "Beitrag",
  type: "document",
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: "title",
      title: "Titel",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      description: "Die Adresse: huberdominik.com/blog/<slug>",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Kategorie",
      type: "string",
      options: { list: [...POST_CATEGORIES], layout: "radio" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Veröffentlicht am",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "pinned",
      title: "Angeheftet",
      description: "Steht in der Übersicht oben, mit Pin",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "excerpt",
      title: "Kurzfassung",
      description: "Ein bis zwei Sätze, für die Beitragsseite und Vorschauen beim Teilen",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(220),
    }),
    defineField({
      // Every post has a cover: shown in the overview and on the post page (16:10)
      name: "cover",
      title: "Titelbild",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Bildbeschreibung",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Text",
      type: "array",
      of: [
        defineArrayMember({ type: "block" }),
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [defineField({ name: "alt", title: "Bildbeschreibung", type: "string" })],
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: "Neueste zuerst",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", category: "category", media: "cover", pinned: "pinned" },
    prepare: ({ title, category, media, pinned }) => ({
      title,
      subtitle: [POST_CATEGORIES.find((option) => option.value === category)?.title, pinned && "angeheftet"]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});
