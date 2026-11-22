import "server-only";

/** Characters Discord would read as formatting */
const MARKDOWN = /[\\*_~`|>[\]()#-]/g;

/** Text typed by a visitor, shown literally in a Discord message */
export const escapeDiscord = (text: string) => text.replace(MARKDOWN, "\\$&");

/**
 * Posts a message to the webhook in DISCORD_WEBHOOK_URL (never pings anyone).
 * Returns false when it isn't configured or Discord refuses.
 */
export async function sendDiscord(lines: string[]): Promise<boolean> {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    console.error("[discord] DISCORD_WEBHOOK_URL is not set");
    return false;
  }
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: lines.join("\n"), allowed_mentions: { parse: [] } }),
  });
  if (!response.ok) console.error("[discord] webhook failed", response.status);
  return response.ok;
}
