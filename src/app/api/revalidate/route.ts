import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

import { ALL_SANITY_TAGS, SANITY_TAGS } from "@/lib/blog-queries";

type WebhookBody = { _type?: string; _id?: string };

/**
 * Sanity webhook: called on every create, update and delete of a published
 * document. Checks the signature, then clears the cached reads of that
 * document type at once, so addresses, cards and the sitemap never point at
 * an old slug.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ message: "SANITY_REVALIDATE_SECRET is not set" }, { status: 500 });

  // Also waits until the change can be read back (Content Lake is eventually consistent)
  const { isValidSignature, body } = await parseBody<WebhookBody>(request, secret, true);
  if (!isValidSignature) return NextResponse.json({ message: "Invalid signature" }, { status: 401 });

  const tag = body?._type && SANITY_TAGS[body._type as keyof typeof SANITY_TAGS];
  // Unknown type: clear everything from Sanity, to be safe
  const tags = tag ? [tag] : ALL_SANITY_TAGS;
  // expire 0: the next visit gets fresh data, never the old version again
  for (const name of tags) revalidateTag(name, { expire: 0 });

  return NextResponse.json({ revalidated: tags, id: body?._id ?? null });
}
