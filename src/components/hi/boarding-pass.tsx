"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";
import { IconAirplane } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";

import { HandwrittenNote } from "@/components/handwritten-note";
import { HI_ACCENT_BG } from "@/components/hi/accent";
import { celebrate } from "@/components/hi/celebrate";
import { useHiState } from "@/components/hi/hi-state";
import { scrollForGrowth } from "@/components/scroll-container";
import { useInstantReveal, useRevealGate } from "@/components/scroll-reveal";
import { HI_CHANNELS, type HiChannel, type HiTrip, normalizeHiContact, normalizeTypedName } from "@/lib/hi";
import { cn } from "@/lib/utils";

export type BoardingPassLabels = {
  title: string;
  subtitle: string;
  /** Where I am: the departure ("Köln") */
  origin: string;
  passenger: string;
  namePlaceholder: string;
  nameInvalid: string;
  surprise: string;
  trips: Record<HiTrip, string>;
  seat: string;
  seatValue: string;
  luggage: string;
  luggageValue: string;
  contact: string;
  channels: Record<HiChannel, string>;
  placeholders: Record<HiChannel, string>;
  invalid: Record<HiChannel, string>;
  privacy: string;
  submit: string;
  sending: string;
  checkedIn: string;
  /** With `{channel}` and `{contact}` */
  checkedInText: string;
  /** Printed on the issued stub: label and (mysterious) value */
  secrets: { label: string; value: string }[];
  done: string;
  error: string;
};

// Airport codes for the route at the top: Cologne/Bonn to Tokyo Haneda or
// Naples (the airport for the Amalfi Coast); no trip chosen yet is a surprise
const ORIGIN_CODE = "CGN";
const TRIP_CODES: Record<HiTrip, string> = { tokyo: "HND", amalfi: "NAP" };
const SURPRISE_CODE = "???";

const INPUT_TYPES: Record<HiChannel, { type: string; inputMode: "tel" | "text" | "email"; autoComplete: string }> = {
  whatsapp: { type: "tel", inputMode: "tel", autoComplete: "tel" },
  instagram: { type: "text", inputMode: "text", autoComplete: "off" },
  email: { type: "email", inputMode: "email", autoComplete: "email" },
};
const EASE = [0.23, 1, 0.32, 1] as const;

// Text field on the blue: a translucent white well, white text
const FIELD =
  "h-11 w-full rounded-lg bg-white/15 px-3 text-base text-white outline-none transition-colors placeholder:text-white/55 focus:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 aria-invalid:ring-2 aria-invalid:ring-white md:text-sm";

// sending: the printer warms up while the request runs (at least WARM_UP ms);
// printing: the stub feeds out of the slot; done: issued
type Status = "idle" | "sending" | "printing" | "done" | "error";

const WARM_UP = 1400;
// Feeding the stub out of the slot (s): in bursts like a thermal printer
const PRINT_DURATION = 2.2;
const FEED_BURSTS = 6;
const FEED_HOLD = 0.5;
// Room kept below the pass while it prints (px): clear of the plus counter
const SCROLL_MARGIN = 88; // pause after each burst, relative to the burst itself

/** Height keyframes for feeding `height` px of paper: burst, hold, burst, … */
function feedKeyframes(height: number) {
  const units = FEED_BURSTS + (FEED_BURSTS - 1) * FEED_HOLD;
  const heights = [0];
  const times = [0];
  const ease: (string | number[])[] = [];
  let t = 0;
  for (let burst = 1; burst <= FEED_BURSTS; burst++) {
    t += 1;
    heights.push((height * burst) / FEED_BURSTS);
    times.push(t / units);
    ease.push([0.3, 0, 0.2, 1]);
    if (burst < FEED_BURSTS) {
      t += FEED_HOLD;
      heights.push((height * burst) / FEED_BURSTS);
      times.push(t / units);
      ease.push("linear");
    }
  }
  return { heights, times, ease };
}

// Zigzag tear-off edge at the bottom of the printed stub
const TEAR_EDGE = "conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 10px 100%";

/**
 * The stub, fed out of the printer slot above it: the paper hangs from the
 * slot (anchored at its bottom edge, so it slides down) while the wrapper
 * grows in bursts. Afterwards it's ordinary content again.
 */
function PrintedStub({
  children,
  reducedMotion,
  spacerRef,
  onPrinted,
}: {
  children: React.ReactNode;
  reducedMotion: boolean;
  /** Below the pass: holds the paper's room while it feeds, so the page can scroll there from the start */
  spacerRef: React.RefObject<HTMLDivElement | null>;
  onPrinted: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [feeding, setFeeding] = useState(!reducedMotion);
  const onPrintedRef = useRef(onPrinted);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const paper = paperRef.current;
    const spacer = spacerRef.current;
    if (!wrapper || !paper) return;
    if (reducedMotion) return onPrintedRef.current();
    const settle = () => {
      // Back into the normal flow
      paper.style.cssText = "";
      wrapper.style.height = "auto";
      if (spacer) spacer.style.height = "";
      setFeeding(false);
      onPrintedRef.current();
    };
    const height = paper.offsetHeight;
    const { heights, times, ease } = feedKeyframes(height);
    wrapper.style.height = "0px";
    // Hangs from the slot while feeding: pinned to the wrapper's bottom, inside its padding
    Object.assign(paper.style, { position: "absolute", left: "var(--pass-x)", right: "var(--pass-x)", bottom: "0" });
    // Paper plus spacer always add up to the final height: the page keeps its
    // length, so it can glide to where the whole ticket shows, in step with the print
    const reserve = () => {
      if (spacer) spacer.style.height = `${Math.max(0, height - wrapper.offsetHeight)}px`;
    };
    reserve();
    const pass = wrapper.closest("form");
    if (pass) scrollForGrowth(pass, height, { margin: SCROLL_MARGIN, duration: PRINT_DURATION * 0.8 });
    const controls = animate(
      wrapper,
      { height: heights },
      { duration: PRINT_DURATION, times, ease: ease as never, onUpdate: reserve },
    );
    controls.then(settle);
    return () => controls.stop();
  }, [reducedMotion, spacerRef]);

  return (
    <div ref={wrapperRef} className="relative -mt-2 overflow-hidden px-(--pass-x)">
      <div ref={paperRef}>
        <div className="bg-white/12 px-3 pt-5 pb-6 sm:px-4" style={{ mask: TEAR_EDGE, WebkitMask: TEAR_EDGE }}>
          {children}
        </div>
      </div>
      {/* Shade where the paper comes out of the slot */}
      <AnimatePresence>
        {feeding && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-linear-to-b from-[#0a2540]/30 to-transparent"
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** While the request runs: the paper edge twitches in the slot, like a printer starting up */
function WarmingUp({ label, reducedMotion }: { label: string; reducedMotion: boolean }) {
  return (
    <div className="-mt-2 flex flex-col items-center pb-5">
      <div className="h-2 w-full px-(--pass-x)">
        <motion.div
          aria-hidden
          className="bg-white/12"
          initial={{ height: 0 }}
          animate={reducedMotion ? { height: 4 } : { height: [0, 4, 3, 6, 5, 8] }}
          transition={reducedMotion ? { duration: 0 } : { duration: 1.4, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
        />
      </div>
      <motion.span
        className="pt-4 text-white/80"
        animate={reducedMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
      >
        {label}
      </motion.span>
    </div>
  );
}

/** Small label on the blue */
function Label({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <span id={id} className="text-xs text-white/70">
      {children}
    </span>
  );
}

/** One printed field of the pass: label above, value below */
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <Label>{label}</Label>
      <span className="font-medium wrap-break-word">{children}</span>
    </div>
  );
}

/** One end of the route: big airport code, the place below */
function RouteEnd({ code, place, align }: { code: string; place: string; align: "start" | "end" }) {
  return (
    <div className={cn("flex min-w-0 flex-col", align === "end" && "items-end text-right")}>
      <span className="text-3xl font-semibold tracking-tight">{code}</span>
      <span className="max-w-full truncate text-xs text-white/70">{place}</span>
    </div>
  );
}

const CODE_SIZE = 19;
const CODE_CENTER = (CODE_SIZE - 1) / 2;

/**
 * The squares of a 2D ticket code (like the Aztec codes on real boarding
 * passes): a bullseye in the middle, the rest pseudo-random but derived from
 * the contact, so the same ticket always gets the same code. Decoration only.
 */
function codeModules(text: string) {
  let seed = 0;
  for (const char of text) seed = (Math.imul(seed, 31) + char.charCodeAt(0)) | 0;
  const random = () => {
    seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x6d2b79f5) | 0;
    return (seed >>> 0) / 4294967296;
  };
  const modules: [number, number][] = [];
  for (let y = 0; y < CODE_SIZE; y++) {
    for (let x = 0; x < CODE_SIZE; x++) {
      const ring = Math.max(Math.abs(x - CODE_CENTER), Math.abs(y - CODE_CENTER));
      // Bullseye: dark center and rings 2 and 4, light rings 1, 3 and 5 around them
      const dark = ring <= 5 ? ring % 2 === 0 && ring < 5 : random() < 0.5;
      if (dark) modules.push([x, y]);
    }
  }
  return modules;
}

/** The ticket code, printed with the stub */
function TicketCode({ text }: { text: string }) {
  return (
    <svg
      aria-hidden
      viewBox={`-1 -1 ${CODE_SIZE + 2} ${CODE_SIZE + 2}`}
      className="size-20 shrink-0 rounded-lg bg-white p-1 text-[#4898F8] sm:size-24"
      shapeRendering="crispEdges"
    >
      {codeModules(text).map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
    </svg>
  );
}

/** White disc whose check mark draws itself */
function CheckMark({ reducedMotion, delay = 0 }: { reducedMotion: boolean; delay?: number }) {
  return (
    <motion.span
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#4898F8]"
      initial={reducedMotion ? false : { scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 22, delay }}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={reducedMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: delay + 0.2 }}
        />
      </svg>
    </motion.span>
  );
}

/**
 * Boarding pass for the first date, the page's closing question: a blue
 * ticket with the route (Cologne to the chosen trip), the name and a few
 * printed details. The visitor adds a way to reach them and checks in: the
 * form folds away, the perforation becomes a printer slot and the stub is
 * printed (how I'll get in touch, what's still secret, a ticket code made
 * from the contact). Then the check mark draws itself and hearts rain.
 */
export function BoardingPass({ labels, after }: { labels: BoardingPassLabels; after?: string }) {
  const { name, trip } = useHiState();
  const reducedMotion = useReducedMotion() ?? false;
  const id = useId();
  const [channel, setChannel] = useState<HiChannel>("whatsapp");
  const [contact, setContact] = useState("");
  const [typedName, setTypedName] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const ref = useRef<HTMLFormElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  // Appears once the paragraph before it has streamed (and it's in view)
  const visible = useRevealGate(ref, { after });
  const instant = useInstantReveal();

  const cleanContact = normalizeHiContact(channel, contact);
  const cleanName = name ?? normalizeTypedName(typedName);
  const checkedIn = status === "done";
  // From submitting on, the lower part belongs to the printer
  const printer = status === "sending" || status === "printing" || checkedIn;
  const slotOpen = status === "sending" || status === "printing";
  const nameError = touched && !cleanName;
  const contactError = touched && !cleanContact;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!cleanContact || !cleanName || (status !== "idle" && status !== "error")) return;
    setStatus("sending");
    // The printer slot (where the form was) comes into view while it warms up
    if (ref.current) scrollForGrowth(ref.current, 0, { margin: SCROLL_MARGIN, duration: 0.6 });
    // The printer gets its moment even when the server is quick
    const warmUp = new Promise((resolve) => setTimeout(resolve, reducedMotion ? 0 : WARM_UP));
    try {
      const [response] = await Promise.all([
        fetch("/api/hi/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, typedName: name ? undefined : typedName, channel, contact, trip }),
        }),
        warmUp,
      ]);
      setStatus(response.ok ? "printing" : "error");
    } catch {
      setStatus("error");
    }
  };

  const fold = {
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 },
    animate: reducedMotion ? { opacity: 1 } : { opacity: 1, height: "auto" },
    exit: reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 },
    transition: { duration: 0.45, ease: EASE },
  };

  return (
    // One child for the page layout: the pass and, below it, the room the printing stub needs
    <div>
    <motion.form
      ref={ref}
      onSubmit={submit}
      noValidate
      className={cn(
        "w-full overflow-hidden rounded-2xl text-sm text-white",
        // Side padding of the pass, shared by the printed stub (also its inline position): tighter on phones
        "[--pass-x:--spacing(4)] sm:[--pass-x:--spacing(5)]",
        HI_ACCENT_BG,
      )}
      initial={instant ? false : reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, filter: "blur(4px)" }}
      animate={visible ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      transition={{ duration: 0.7, ease: EASE }}
      // Not usable before it has appeared
      inert={!visible}
    >
      <div className="flex flex-col gap-5 px-(--pass-x) pt-4 pb-5">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>{labels.title}</span>
          <span>{labels.subtitle}</span>
        </div>

        {/* The route, the heart of every boarding pass */}
        <div className="flex items-center gap-3">
          <RouteEnd code={ORIGIN_CODE} place={labels.origin} align="start" />
          <div aria-hidden className="flex flex-1 items-center gap-2 text-white/70">
            <span className="h-px flex-1 border-t border-dashed border-white/50" />
            <IconAirplane className="size-5 rotate-45" />
            <span className="h-px flex-1 border-t border-dashed border-white/50" />
          </div>
          <RouteEnd
            code={trip ? TRIP_CODES[trip] : SURPRISE_CODE}
            place={trip ? labels.trips[trip] : labels.surprise}
            align="end"
          />
        </div>

        {/* Printed details; on the generic page the name is filled in here */}
        {name || printer ? (
          <div className="grid grid-cols-3 gap-3">
            <Field label={labels.passenger}>{cleanName}</Field>
            <Field label={labels.seat}>{labels.seatValue}</Field>
            <Field label={labels.luggage} className="text-right">
              {labels.luggageValue}
            </Field>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Labelled via aria-labelledby, not a <label>: the site cursor treats
                labels as clickable and would show their text as a bubble on the field */}
            <div className="flex flex-col gap-1.5">
              <Label id={`${id}-name-label`}>{labels.passenger}</Label>
              <input
                aria-labelledby={`${id}-name-label`}
                value={typedName}
                onChange={(event) => setTypedName(event.target.value)}
                placeholder={labels.namePlaceholder}
                autoComplete="given-name"
                maxLength={40}
                aria-invalid={nameError}
                className={FIELD}
              />
              {nameError && <span className="text-xs font-medium">{labels.nameInvalid}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={labels.seat}>{labels.seatValue}</Field>
              <Field label={labels.luggage} className="text-right">
                {labels.luggageValue}
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* Perforation: notches punched out of both edges (page background), dashes between */}
      {/* While printing, the tear line opens up into the printer slot */}
      <div aria-hidden className="relative z-10 flex h-5 items-center">
        <span className="absolute -left-2.5 size-5 rounded-full bg-background" />
        <span className="relative mx-4 flex h-1.5 flex-1 items-center">
          <motion.span
            className="absolute inset-x-0 border-t border-dashed border-white/40"
            initial={false}
            animate={{ opacity: slotOpen ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          />
          <motion.span
            className="absolute inset-0 rounded-full bg-[#0a2540]/45 shadow-[inset_0_1px_2px_rgb(0_0_0/0.45)]"
            initial={false}
            animate={{ opacity: slotOpen ? 1 : 0, scaleX: slotOpen ? 1 : 0.7 }}
            transition={{ duration: 0.4, ease: EASE }}
          />
        </span>
        <span className="absolute -right-2.5 size-5 rounded-full bg-background" />
      </div>

      <AnimatePresence initial={false} mode="wait">
        {printer && cleanContact ? (
          <motion.div key="printer" {...fold} aria-live="polite">
            {status === "sending" ? (
              <WarmingUp label={labels.sending} reducedMotion={reducedMotion} />
            ) : (
              <div className="pb-5">
                <PrintedStub
                  reducedMotion={reducedMotion}
                  spacerRef={spacerRef}
                  onPrinted={() => {
                    setStatus("done");
                    celebrate();
                  }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      {/* Drawn once the stub is out */}
                      <CheckMark reducedMotion={reducedMotion} delay={reducedMotion ? 0 : PRINT_DURATION} />
                      <div className="flex min-w-0 flex-col">
                        <span className="font-medium">{labels.checkedIn}</span>
                        <span className="text-white/75 wrap-anywhere">
                          {labels.checkedInText
                            .replace("{channel}", labels.channels[channel])
                            // The number as typed (with its spaces), handle and email cleaned up
                            .replace("{contact}", channel === "whatsapp" ? contact.trim() : cleanContact)}
                        </span>
                      </div>
                    </div>
                    {/* What stays a secret until the date, next to the ticket code */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <dl className="flex min-w-0 flex-1 flex-col gap-2">
                        {labels.secrets.map(({ label, value }) => (
                          <div key={label} className="flex min-w-0 flex-col">
                            <dt className="text-xs text-white/70">{label}</dt>
                            <dd className="font-medium wrap-break-word">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <TicketCode text={cleanContact} />
                    </div>
                    <div className="flex justify-center">
                      <HandwrittenNote tilt={-2} delay={reducedMotion ? 0 : PRINT_DURATION + 0.4} className="text-white/85">
                        {labels.done}
                      </HandwrittenNote>
                    </div>
                  </div>
                </PrintedStub>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="form" {...fold}>
            <div className="flex flex-col gap-3 px-(--pass-x) pt-4 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{labels.contact}</span>
                <div role="radiogroup" aria-label={labels.contact} className="flex gap-1">
                  {(Object.keys(HI_CHANNELS) as HiChannel[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={channel === key}
                      onClick={() => {
                        setChannel(key);
                        setContact("");
                        setTouched(false);
                      }}
                      className={cn(
                        "relative rounded-full px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                        channel === key ? "text-[#4898F8]" : "text-white/75 hover:text-white",
                      )}
                    >
                      {channel === key && (
                        <motion.span
                          layoutId={`${id}-channel`}
                          className="absolute inset-0 rounded-full bg-white"
                          transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className="relative">{labels.channels[key]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  {channel === "instagram" && (
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/70">@</span>
                  )}
                  <input
                    key={channel}
                    aria-label={labels.channels[channel]}
                    {...INPUT_TYPES[channel]}
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    onBlur={() => contact && setTouched(true)}
                    placeholder={labels.placeholders[channel]}
                    maxLength={channel === "email" ? 254 : 40}
                    aria-invalid={contactError}
                    className={cn(FIELD, channel === "instagram" && "pl-7")}
                  />
                </div>
                {contactError && <span className="text-xs font-medium">{labels.invalid[channel]}</span>}
              </div>

              <button
                type="submit"
                disabled={status !== "idle" && status !== "error"}
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-white font-medium text-[#1f5fbf] transition-[background-color,transform] outline-none hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/60 active:translate-y-px disabled:opacity-70"
              >
                <IconAirplane className="size-4" />
                {status === "sending" ? labels.sending : labels.submit}
              </button>

              <p className={cn("text-center text-xs", status === "error" ? "font-medium text-white" : "text-white/65")}>
                {status === "error" ? labels.error : labels.privacy}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
    <div ref={spacerRef} aria-hidden />
    </div>
  );
}
