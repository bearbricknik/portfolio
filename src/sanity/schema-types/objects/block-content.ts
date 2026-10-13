import { ImageIcon } from "@sanity/icons/Image";
import { PlayIcon } from "@sanity/icons/Play";
import { LinkIcon } from "@sanity/icons/Link";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { defineArrayMember, defineField, defineType } from "sanity";

/** Languages a code block can be highlighted as */
const CODE_LANGUAGES = [
  { title: "TypeScript", value: "typescript" },
  { title: "TSX", value: "tsx" },
  { title: "JavaScript", value: "javascript" },
  { title: "JSX", value: "jsx" },
  { title: "CSS", value: "css" },
  { title: "HTML", value: "html" },
  { title: "JSON", value: "json" },
  { title: "Shell", value: "sh" },
  { title: "GROQ", value: "groq" },
  { title: "Golang", value: "go" },
  { title: "Python", value: "python" },
  { title: "SQL", value: "sql" },
  { title: "Markdown", value: "markdown" },
];

/** Interactive demos a post can embed (texts and labels come from the site's messages) */
const DEMOS = [
  { title: "Kurven: ease-in gegen das Ease-out der Seite", value: "easing" },
  { title: "Text: Wörter mit und ohne Unschärfe", value: "blurText" },
  { title: "Feder: Polaroid beim Drüberfahren", value: "spring" },
];

/**
 * The text of a post: paragraphs, headings, quotes, lists, links (external
 * and to other posts), inline code, images, code blocks and interactive demos. Used once per
 * language (internationalized array).
 */
export const blockContent = defineType({
  name: "blockContent",
  title: "Text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Absatz", value: "normal" },
        { title: "Überschrift", value: "h2" },
        { title: "Unterüberschrift", value: "h3" },
        { title: "Zitat", value: "blockquote" },
      ],
      lists: [
        { title: "Aufzählung", value: "bullet" },
        { title: "Nummeriert", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Fett", value: "strong" },
          { title: "Kursiv", value: "em" },
          { title: "Durchgestrichen", value: "strike-through" },
          { title: "Code", value: "code" },
        ],
        annotations: [
          defineArrayMember({
            name: "link",
            title: "Link",
            type: "object",
            icon: LinkIcon,
            fields: [
              defineField({
                name: "href",
                title: "URL",
                type: "url",
                validation: (rule) => rule.required().uri({ scheme: ["http", "https", "mailto"] }),
              }),
            ],
          }),
          defineArrayMember({
            // To another post: stays valid when its slug changes
            name: "postLink",
            title: "Beitrag",
            type: "object",
            icon: DocumentTextIcon,
            fields: [
              defineField({
                name: "post",
                title: "Beitrag",
                type: "reference",
                to: [{ type: "post" }],
                validation: (rule) => rule.required(),
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({
      type: "image",
      icon: ImageIcon,
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Bildbeschreibung",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({ name: "caption", title: "Bildunterschrift", type: "string" }),
      ],
    }),
    defineArrayMember({
      type: "code",
      title: "Code",
      options: { language: "typescript", languageAlternatives: CODE_LANGUAGES, withFilename: true },
    }),
    defineArrayMember({
      // An interactive example, built in the site's code (src/components/blog/post-demos.tsx)
      name: "demo",
      title: "Demo",
      type: "object",
      icon: PlayIcon,
      fields: [
        defineField({
          name: "kind",
          title: "Demo",
          type: "string",
          options: { list: DEMOS, layout: "radio" },
          validation: (rule) => rule.required(),
        }),
      ],
      preview: {
        select: { kind: "kind" },
        prepare: ({ kind }) => ({
          title: DEMOS.find((demo) => demo.value === kind)?.title ?? "Demo",
          subtitle: "Demo",
        }),
      },
    }),
  ],
});
