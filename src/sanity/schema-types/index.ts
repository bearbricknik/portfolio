import { category } from "@/sanity/schema-types/documents/category";
import { post } from "@/sanity/schema-types/documents/post";
import { blockContent } from "@/sanity/schema-types/objects/block-content";

/** Every document and object type of the Studio */
export const schemaTypes = [post, category, blockContent];
