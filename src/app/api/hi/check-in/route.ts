import { type NextRequest, NextResponse } from "next/server";

import { escapeDiscord, sendDiscord } from "@/lib/discord.server";
import {
  HI_CHANNELS,
  HI_TRIPS,
  isHiChannel,
  isHiTrip,
  normalizeHiContact,
  normalizeTypedName,
  parseHiName,
} from "@/lib/hi";

/** Direct link for the contact, so it's one tap from the Discord message */
function contactLink(channel: keyof typeof HI_CHANNELS, contact: string) {
  if (channel === "whatsapp") return contact.startsWith("+") ? `<https://wa.me/${contact.slice(1)}>` : null;
  if (channel === "instagram") return `<https://instagram.com/${contact.slice(1)}>`;
  return null;
}

/**
 * The boarding pass on /hi: the visitor leaves a way to reach them. Every
 * field is validated again here; typed text is escaped, so it shows up in
 * Discord exactly as entered.
 */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  const { name, typedName, channel, contact, trip } = (body ?? {}) as Record<string, unknown>;

  if (!isHiChannel(channel) || typeof contact !== "string") {
    return NextResponse.json({ message: "Invalid contact" }, { status: 400 });
  }
  const cleanContact = normalizeHiContact(channel, contact);
  if (!cleanContact) return NextResponse.json({ message: "Invalid contact" }, { status: 400 });

  // The name from the address, or (generic page) the one typed on the pass
  const fromAddress = parseHiName(typeof name === "string" ? name : null);
  const typed = typeof typedName === "string" ? normalizeTypedName(typedName) : null;
  const who = fromAddress ?? typed;
  if (!who) return NextResponse.json({ message: "Invalid name" }, { status: 400 });

  const link = contactLink(channel, cleanContact);
  const sent = await sendDiscord([
    `🎫 **${escapeDiscord(who)}** hat eingecheckt${fromAddress ? "" : " (Name selbst eingetragen)"}`,
    `${HI_CHANNELS[channel]}: ${escapeDiscord(cleanContact)}${link ? ` · ${link}` : ""}`,
    `✈️ Reise: ${isHiTrip(trip) ? HI_TRIPS[trip] : "keine gewählt"}`,
  ]);

  return sent ? NextResponse.json({ ok: true }) : NextResponse.json({ message: "Not delivered" }, { status: 502 });
}
