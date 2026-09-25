import type messages from "../messages/de.json";
import type { Locale } from "@/i18n/config";

// Type-safe message keys and locales for next-intl
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
