/**
 * The /hi page: a playful "application" for a first date, shared on dating
 * apps. /hi is generic, /hi/<name> greets the person by name. Shared by the
 * page and the check-in API route (src/app/api/hi/check-in/route.ts).
 */

import { isLocale, type Locale } from "@/i18n/config";

/** Address of the page; /hi/<name> greets by name */
export const HI_PATH = "/hi";

/**
 * The page always opens in German, whatever language the visitor picked on
 * the rest of the site. English only via `?lang=en` (what the language switch
 * sets there), so the global language cookie is neither read nor changed.
 */
export const HI_LOCALE_PARAM = "lang";
export const HI_DEFAULT_LOCALE: Locale = "de";

/**
 * Whether an address belongs to /hi. Also accepts the internal address with
 * the locale (/de/hi/…), which is what pages see while being prerendered.
 */
export function isHiPath(pathname: string) {
  const [, first] = pathname.split("/");
  const path = isLocale(first) ? pathname.slice(first.length + 1) || "/" : pathname;
  return path === HI_PATH || path.startsWith(`${HI_PATH}/`);
}

/** Trips to choose from; labels as they arrive in Discord */
export const HI_TRIPS = {
  tokyo: "Tokio",
  amalfi: "Amalfi-Küste",
} as const;

export type HiTrip = keyof typeof HI_TRIPS;

export const isHiTrip = (value: unknown): value is HiTrip =>
  typeof value === "string" && Object.hasOwn(HI_TRIPS, value);

// Letters only (umlauts and accents included), optionally joined by hyphens
const NAME_PATTERN = /^\p{L}{1,20}(?:-\p{L}{1,20})?$/u;

/**
 * The name from the address ("anna-lena" → "Anna-Lena"), or null when it
 * isn't a plausible first name; the page then greets generically. Keeps
 * arbitrary text out of the page and out of the Discord message.
 */
export function parseHiName(slug: string | undefined | null): string | null {
  if (!slug) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(slug).trim();
  } catch {
    return null;
  }
  if (!NAME_PATTERN.test(decoded)) return null;
  return decoded
    .split("-")
    .map((part) => part.charAt(0).toLocaleUpperCase("de") + part.slice(1).toLocaleLowerCase("de"))
    .join("-");
}

/** Ways to reach the visitor, picked on the boarding pass; labels as they arrive in Discord */
export const HI_CHANNELS = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  email: "E-Mail",
} as const;

export type HiChannel = keyof typeof HI_CHANNELS;

export const isHiChannel = (value: unknown): value is HiChannel =>
  typeof value === "string" && Object.hasOwn(HI_CHANNELS, value);

const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,189}\.[^\s@]{2,}$/;
const INSTAGRAM_PATTERN = /^[a-z0-9._]{1,30}$/;

/**
 * The contact as typed, cleaned up ("+49 170 123 45 67" → "+491701234567",
 * "@Lena.X" → "@lena.x"), or null when it doesn't look right. Used by the
 * form for its hints and again by the API route, which trusts nothing.
 */
export function normalizeHiContact(channel: HiChannel, raw: string): string | null {
  const value = raw.trim();
  if (channel === "whatsapp") {
    if (!/^\+?[\d\s()/-]+$/.test(value)) return null;
    const digits = value.replace(/\D/g, "");
    if (digits.length < 6 || digits.length > 15) return null;
    return `${value.startsWith("+") ? "+" : ""}${digits}`;
  }
  if (channel === "instagram") {
    const handle = value.replace(/^@/, "").toLowerCase();
    return INSTAGRAM_PATTERN.test(handle) ? `@${handle}` : null;
  }
  const email = value.toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
}

/** A name typed on the boarding pass (generic page): letters, spaces, hyphens, apostrophes */
export function normalizeTypedName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  return /^[\p{L}][\p{L} '’-]{0,39}$/u.test(name) ? name : null;
}
