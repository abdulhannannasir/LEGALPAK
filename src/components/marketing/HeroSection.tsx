import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ContractTablet } from "./ContractTablet";

// Three.js/R3F is a heavy client-only dependency — load it lazily and only
// after mount, so it never ships in the SSR pass or blocks first paint.
const BackgroundCanvas = lazy(() =>
  import("./BackgroundCanvas").then((m) => ({ default: m.BackgroundCanvas })),
);

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function HeroSection() {
  const mounted = useMounted();

  return (
    <section className="relative overflow-hidden pt-36 pb-20 sm:pt-44">
      {/* Ambient marble/vignette backdrop */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.08), transparent 60%), radial-gradient(ellipse 60% 50% at 85% 90%, rgba(63,95,138,0.12), transparent 60%), var(--lux-bg)",
        }}
      />
      {mounted && (
        <Suspense fallback={null}>
          <BackgroundCanvas />
        </Suspense>
      )}

      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center lg:text-left"
        >
          <p className="text-xs font-medium tracking-[0.3em] text-[var(--lux-bronze)] uppercase">
            Pakistan · Corporate &amp; Commercial
          </p>
          <h1
            className="mt-5 text-4xl leading-[1.1] text-[var(--lux-fg)] sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-lux-serif)" }}
          >
            Empowering Growth{" "}
            <span className="italic text-[var(--lux-gold)]">through Global Legal</span> Expertise.
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-[var(--lux-muted)] lg:mx-0">
            SECP filings, commercial contracts, and bespoke corporate counsel — drafted with the
            rigour of a private client desk.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Link
              to="/dashboard"
              className="rounded-full border border-[var(--lux-border-strong)] px-7 py-3 text-xs font-medium tracking-widest text-[var(--lux-fg)] uppercase transition-colors hover:border-[var(--lux-gold)] hover:text-[var(--lux-gold)]"
            >
              Explore Services
            </Link>
            <Link
              to="/consult"
              className="rounded-full bg-[var(--lux-gold)] px-7 py-3 text-xs font-medium tracking-widest text-black uppercase transition-opacity hover:opacity-90"
            >
              Request Consultation
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <ContractTablet />
        </motion.div>
      </div>

      <motion.div
        className="absolute inset-x-0 bottom-6 flex justify-center"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="size-5 text-[var(--lux-gold)]" strokeWidth={1.5} />
      </motion.div>
    </section>
  );
}
