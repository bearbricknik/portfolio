import { defineQuery } from "next-sanity";

/**
 * Every published post with its address per language (only languages that
 * have one) and when it last changed, for the sitemap
 */
export const POST_SITEMAP_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.de.current) && publishedAt <= now()] | order(publishedAt desc) {
    "slugs": { "de": slug.de.current, "en": slug.en.current },
    _updatedAt
  }
`);

// A translated field in the visitor's language, falling back to German
const t = (field: string) => `coalesce(${field}[language == $locale][0].value, ${field}[language == "de"][0].value)`;

/** The posts of the overview, pinned first, then newest first, in the visitor's language */
export const POST_CARDS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.de.current) && publishedAt <= now()] | order(pinned desc, publishedAt desc) {
    _id,
    "slug": coalesce(slug[$locale].current, slug.de.current),
    "title": ${t("title")},
    publishedAt,
    "pinned": pinned == true,
    "category": category->{ "key": key.current, icon, "title": ${t("title")} },
    "cover": cover {
      asset, crop, hotspot,
      "alt": ${t("alt")},
      "lqip": asset->metadata.lqip
    }
  }
`);

/** Categories for the filter, in order, with how many published posts each has */
export const CATEGORIES_QUERY = defineQuery(`
  *[_type == "category"] | order(order asc) {
    "key": key.current,
    icon,
    "title": ${t("title")},
    "count": count(*[_type == "post" && references(^._id) && defined(slug.de.current) && publishedAt <= now()])
  }
`);

// The post's text in the visitor's language (German if there's no translation)
const body = `coalesce(body[language == $locale][0].value, body[language == "de"][0].value)`;

/**
 * One post by either of its addresses, in the visitor's language: links to
 * other posts resolve to their address in that language, images bring their
 * placeholder and size, and the text length gives the reading time
 */
export const POST_QUERY = defineQuery(`
  *[_type == "post" && (slug.de.current == $slug || slug.en.current == $slug) && publishedAt <= now()][0] {
    _id,
    _updatedAt,
    "slugs": { "de": slug.de.current, "en": slug.en.current },
    "title": ${t("title")},
    "excerpt": ${t("excerpt")},
    publishedAt,
    "category": category->{ "key": key.current, icon, "title": ${t("title")} },
    "cover": cover {
      asset, crop, hotspot,
      "alt": ${t("alt")},
      "lqip": asset->metadata.lqip
    },
    "characters": length(pt::text(${body})),
    "body": ${body}[] {
      ...,
      _type == "block" => {
        ...,
        markDefs[] {
          ...,
          _type == "postLink" => { "slug": coalesce(post->slug[$locale].current, post->slug.de.current) }
        }
      },
      _type == "image" => {
        ...,
        "lqip": asset->metadata.lqip,
        "dimensions": asset->metadata.dimensions { width, height }
      }
    }
  }
`);
