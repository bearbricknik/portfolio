import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { TagIcon } from "@sanity/icons/Tag";
import type { StructureResolver } from "sanity/structure";

/** Studio sidebar: posts (newest first) and categories */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Blog")
    .items([
      S.listItem()
        .title("Beiträge")
        .icon(DocumentTextIcon)
        .child(S.documentTypeList("post").title("Beiträge").defaultOrdering([{ field: "publishedAt", direction: "desc" }])),
      S.listItem()
        .title("Kategorien")
        .icon(TagIcon)
        .child(S.documentTypeList("category").title("Kategorien").defaultOrdering([{ field: "order", direction: "asc" }])),
    ]);
