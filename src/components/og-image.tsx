/**
 * Open Graph image layout, rendered by next/og (Satori): only inline styles
 * and flexbox are supported, no Tailwind classes.
 */
export function OpenGraphImage({
  title,
  description,
  domain,
}: {
  title: string;
  description: string;
  domain: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "Geist",
      }}
    >
      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, #ffffff0d 1px, transparent 1px), linear-gradient(to bottom, #ffffff0d 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 72,
          padding: "12px 24px",
          borderRadius: 9999,
          border: "1px solid #ffffff26",
          backgroundColor: "#171717",
          fontSize: 28,
          color: "#a3a3a3",
        }}
      >
        {domain}
      </div>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 88,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 500, lineHeight: 1, letterSpacing: -2 }}>{title}</div>
        <div style={{ fontSize: 36, lineHeight: 1.35, color: "#a3a3a3", maxWidth: 900 }}>
          {description}
        </div>
      </div>
    </div>
  );
}
