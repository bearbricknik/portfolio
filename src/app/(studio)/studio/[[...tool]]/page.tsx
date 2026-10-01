import { NextStudio } from "next-sanity/studio";

import config from "../../../../../sanity.config";

// The Studio is a client app: render its shell once at build time
export const dynamic = "force-static";

// Studio title, favicon, robots noindex and viewport
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
