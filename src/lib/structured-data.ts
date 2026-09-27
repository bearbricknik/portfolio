import { siteConfig } from "@/lib/site";
import { SOCIALS } from "@/lib/socials";

/** Stable ids, so pages can point at the person and the site defined once in the layout */
export const PERSON_ID = `${siteConfig.url}/#person`;
export const WEBSITE_ID = `${siteConfig.url}/#website`;

/** Person + WebSite for every page (rendered by the root layout) */
export function siteGraph({ locale, role, description }: { locale: string; role: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: "Dominik Huber",
        url: siteConfig.url,
        image: `${siteConfig.url}/opengraph-image`,
        jobTitle: role,
        description,
        email: "mailto:dominik.huber97@googlemail.com",
        // Profiles elsewhere (X, GitHub, LinkedIn)
        sameAs: SOCIALS.filter((social) => social.href.startsWith("http")).map((social) => social.href),
        alumniOf: { "@type": "CollegeOrUniversity", name: "Universität Stuttgart" },
        homeLocation: {
          "@type": "Place",
          name: "Köln",
          address: { "@type": "PostalAddress", addressLocality: "Köln", addressRegion: "NRW", addressCountry: "DE" },
        },
        knowsAbout: ["Next.js", "React", "TypeScript", "JavaScript", "Node.js", "Python", "Frontend development"],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "Dominik Huber",
        url: siteConfig.url,
        inLanguage: locale,
        publisher: { "@id": PERSON_ID },
      },
    ],
  };
}

type PageGraphOptions = {
  path: `/${string}`;
  /** Page title (breadcrumb label) */
  name: string;
  description: string;
  locale: string;
  /** "Start"/"Home", the first breadcrumb */
  homeName: string;
  /** schema.org page type, e.g. "ProfilePage" for the about page */
  type?: "WebPage" | "ProfilePage" | "AboutPage" | "ContactPage";
  /** Extra properties for the page node (e.g. `mentions`) */
  extra?: Record<string, unknown>;
};

/** WebPage (about the person) + BreadcrumbList for a subpage */
export function pageGraph({ path, name, description, locale, homeName, type = "WebPage", extra }: PageGraphOptions) {
  const url = `${siteConfig.url}${path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": type,
        "@id": `${url}#webpage`,
        url,
        name,
        description,
        inLanguage: locale,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": PERSON_ID },
        ...(type === "ProfilePage" && { mainEntity: { "@id": PERSON_ID } }),
        breadcrumb: { "@id": `${url}#breadcrumb` },
        ...extra,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: homeName, item: siteConfig.url },
          { "@type": "ListItem", position: 2, name, item: url },
        ],
      },
    ],
  };
}
