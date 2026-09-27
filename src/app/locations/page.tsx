import type { Metadata } from "next";
import { IconCalendar1, IconEmail1, IconMapPin } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { IconHeart as IconHeartFilled } from "@central-icons-react/round-filled-radius-3-stroke-1.5";
import { useLocale, useTranslations } from "next-intl";

import { MapAttributionCollapsed } from "@/components/map-attribution-collapsed";
import { MapDriveRoute } from "@/components/map-drive-route";
import { MapFitBounds } from "@/components/map-fit-bounds";
import { PageHeading } from "@/components/page-heading";
import { Badge, ExternalBadge } from "@/components/inline-badge";
import { ScrollReveal } from "@/components/scroll-reveal";
import { StreamingText } from "@/components/streaming-text";
import { Map, MapControls, MapMarker, MarkerContent, MarkerLabel } from "@/components/ui/map";
import { DRIVE_ROUTE } from "@/lib/drive-route";
import { INTRO_TIMING } from "@/lib/intro-timing";
import { PageJsonLd } from "@/components/page-json-ld";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ namespace: "LocationsPage", path: "/locations" });
}

// [longitude, latitude]
const COLOGNE: [number, number] = [6.9583, 50.9413];
// Nersingen (Hubertusweg 36); place-level precision is enough at this zoom
const NERSINGEN: [number, number] = [10.1206, 48.4267];
// The road route, extended to the exact marker positions
const ROUTE: [number, number][] = [COLOGNE, ...DRIVE_ROUTE, NERSINGEN];
// Both places always in view, with some room around them; more at the bottom
// (labels sit below the dots, the attribution bottom right) and on the right
// (zoom controls)
const BOUNDS: [[number, number], [number, number]] = [COLOGNE, NERSINGEN];
const BOUNDS_PADDING = { top: 40, right: 100, bottom: 72, left: 64 };

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

const EMAIL = "dominik.huber97@googlemail.com";
const CAL_URL = "https://cal.com/dominik-huber-curt5d/15-minuten";

function Marker({ position, label }: { position: [number, number]; label: string }) {
  return (
    <MapMarker longitude={position[0]} latitude={position[1]}>
      <MarkerContent>
        <div className="size-3 rounded-full bg-foreground ring-4 ring-foreground/15" />
        {/* Positioned relative to the dot, so it has to live inside MarkerContent */}
        <MarkerLabel position="bottom" className="mt-1.5 text-xs">
          {label}
        </MarkerLabel>
      </MarkerContent>
    </MapMarker>
  );
}

export default function Locations() {
  const t = useTranslations("LocationsPage");
  const locale = useLocale();

  return (
    // Same spacing as the paragraphs on the other pages
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">{t("title")}</h1>
      <PageJsonLd namespace="LocationsPage" path="/locations" type="ContactPage" extra={LOCATIONS_JSON_LD} />
      <PageHeading page="locations" stream />

      <StreamingText
        key={locale}
        id={`locations-intro-${locale}`}
        notBefore={INTRO_TIMING.bodyStreamStart}
        interval={30}
        className="flex flex-col gap-6"
        textClassName="text-left text-pretty hyphens-auto sm:text-justify"
        content={t.rich("intro", {
          heart: (chunks) => (
            <Badge icon={IconHeartFilled} color="text-red-500">
              {chunks}
            </Badge>
          ),
          cal: (chunks) => (
            <ExternalBadge href={CAL_URL} icon={IconCalendar1} color="text-muted-foreground" cursorLabel="cal.com ↗">
              {chunks}
            </ExternalBadge>
          ),
          email: (chunks) => (
            <ExternalBadge
              href={`mailto:${EMAIL}`}
              icon={IconEmail1}
              color="text-muted-foreground"
              cursorLabel={EMAIL}
              newTab={false}
            >
              {chunks}
            </ExternalBadge>
          ),
        })}
      />

      {/* Everything below appears once the intro has streamed, then in view */}
      <ScrollReveal waitForStreams className="flex flex-col gap-4">
        <div className="h-72 overflow-hidden rounded-xl border">
          <Map
            // Initial view; MapFitBounds keeps it right when the size changes
            bounds={BOUNDS}
            fitBoundsOptions={{ padding: BOUNDS_PADDING }}
            // The wheel scrolls the page, not the map; zoom via the controls
            scrollZoom={false}
          >
            <MapFitBounds bounds={BOUNDS} padding={BOUNDS_PADDING} />
            <MapControls />
            <MapAttributionCollapsed />
            {/* Before the markers, so the city dots sit on top of the line */}
            <MapDriveRoute coordinates={ROUTE} />
            <Marker position={COLOGNE} label={t("map.cologne")} />
            <Marker position={NERSINGEN} label={t("map.nersingen")} />
          </Map>
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
