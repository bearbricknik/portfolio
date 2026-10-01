/**
 * Root layout of the Studio: none of the site's frame (header, scroll area,
 * cursor), the Studio takes the whole window
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
