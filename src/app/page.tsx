import { useLocale, useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { StreamingText } from "@/components/streaming-text";
import { ThemeSwitcher } from "@/components/theme-switcher";

const projects = ["nordlicht", "tidewave", "papercut"];

function InlineLink({ children }: { children: React.ReactNode }) {
  return (
    <a
      href="#"
      className="underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:decoration-foreground"
    >
      {children}
    </a>
  );
}

function ProjectChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted px-2 py-0.5 text-sm">
      <span className="size-3 rounded-sm bg-foreground" />
      {name}
    </span>
  );
}

export default function Home() {
  const t = useTranslations("HomePage");
  const locale = useLocale();
  const projectsTail = t("projectsTail");

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-20 px-6 py-12">
      <section className="flex flex-col gap-6 leading-relaxed">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-medium">{t("name")}</h1>
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeSwitcher />
          </div>
        </div>

        {/*
          Streams in once the intro overlay is gone; "\n\n" starts a new paragraph.
          key: a language switch remounts and streams the other language once;
          id: each language only animates once until the next page refresh.
        */}
        <StreamingText
          key={locale}
          id={`home-intro-${locale}`}
          notBefore={3800}
          className="flex flex-col gap-6"
          content={[
            `${t("intro")}\n\n${t("projectsLead")} `,
            ...projects.map((project) => <ProjectChip key={project} name={project} />),
            // No space before punctuation, e.g. English "… papercut. Evenings …"
            /^[.,]/.test(projectsTail) ? projectsTail : ` ${projectsTail}`,
            "\n\n",
            t.rich("contact", {
              github: (chunks) => <InlineLink>{chunks}</InlineLink>,
              linkedin: (chunks) => <InlineLink>{chunks}</InlineLink>,
              x: (chunks) => <InlineLink>{chunks}</InlineLink>,
              email: (chunks) => <InlineLink>{chunks}</InlineLink>,
            }),
          ]}
        />
      </section>
    </div>
  );
}
