import type { Metadata } from "next";
import { IconMapPin } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { IconHeart as IconHeartFilled } from "@central-icons-react/round-filled-radius-3-stroke-1.5";
import { useTranslations } from "next-intl";

import { PageIntro } from "@/components/page-intro";
import { contactBadges } from "@/components/contact-badges";
import { Badge } from "@/components/inline-badge";
import { ScrollReveal } from "@/components/scroll-reveal";
import { LazyLocationsMap } from "@/components/lazy-locations-map";
import { PageJsonLd } from "@/components/page-json-ld";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ namespace: "LocationsPage", path: "/locations" });
}

const COMPANIES = [
  { name: "DGH Grundbesitz eGbR", street: "Hubertusweg 36", city: "89278 Nersingen" },
  { name: "DH Holding GmbH", street: "Hubertusweg 36", city: "89278 Nersingen" },
];

// Structured data: the companies on this page, with their address
const LOCATIONS_JSON_LD = {
  mentions: COMPANIES.map((company) => ({
    "@type": "Organization",
    name: company.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.street,
      postalCode: company.city.split(" ")[0],
      addressLocality: company.city.split(" ").slice(1).join(" "),
      addressCountry: "DE",
    },
  })),
};

export default function Locations() {
  const t = useTranslations("LocationsPage");
  const tContact = useTranslations("Contact");

  return (
    // Same spacing as the paragraphs on the other pages
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">{t("title")}</h1>
      <PageJsonLd namespace="LocationsPage" path="/locations" type="ContactPage" extra={LOCATIONS_JSON_LD} />
      <PageIntro
        id="locations-intro"
        // Where I'm from, then how to reach me (shared with the home page)
        content={[
          t.rich("intro", {
            heart: (chunks) => (
              <Badge icon={IconHeartFilled} color="text-red-500">
                {chunks}
              </Badge>
            ),
          }),
          "\n\n",
          tContact.rich("text", contactBadges),
        ]}
      />

      {/* Everything below appears once the intro has streamed, then in view */}
      <ScrollReveal waitForStreams className="flex flex-col gap-4">
        <div className="h-72 overflow-hidden rounded-xl border">
          <LazyLocationsMap labels={{ cologne: t("map.cologne"), nersingen: t("map.nersingen") }} />
        </div>

        {/* Company addresses right below the map */}
        <div className="grid gap-4 sm:grid-cols-2">
          {COMPANIES.map((company) => (
            <address key={company.name} className="flex gap-3 rounded-xl border p-4 text-sm not-italic">
              <IconMapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium">{company.name}</span>
                <span className="text-muted-foreground">{company.street}</span>
                <span className="text-muted-foreground">{company.city}</span>
                <span className="text-muted-foreground">{t("country")}</span>
              </div>
            </address>
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}
