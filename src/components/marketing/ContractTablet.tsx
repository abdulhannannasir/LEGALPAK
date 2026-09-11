import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";

const DOCUMENT_TITLES = ["CONTRACT", "SECP FORM A", "BOARD RESOLUTION"];
const CLAUSE_TAGS = [
  { label: "Party Details", top: "10%", left: "-8%" },
  { label: "Capitalization", top: "34%", right: "-12%" },
  { label: "Indemnity", top: "62%", left: "-14%" },
  { label: "Execution", top: "84%", right: "-6%" },
];

/**
 * Interactive tilted glass document mockup for the hero — reacts to the
 * cursor with a 3D perspective tilt, cycles through the three document types
 * LegalPak actually generates, and surfaces the clause categories as
 * floating "holographic" tags around the slate.
 */
export function ContractTablet() {
  const ref = useRef<HTMLDivElement>(null);
  const [titleIndex, setTitleIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTitleIndex((i) => (i + 1) % DOCUMENT_TITLES.length), 2600);
    return () => clearInterval(id);
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 150,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), {
    stiffness: 150,
    damping: 18,
  });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div className="relative mx-auto w-full max-w-md" style={{ perspective: 1400 }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_0_60px_-15px_rgba(212,175,55,0.35)] backdrop-blur-md"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-[10px] font-medium tracking-[0.25em] text-[var(--lux-muted)] uppercase">
            LegalPak Draft
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={titleIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="text-sm tracking-widest text-[var(--lux-gold)]"
              style={{ fontFamily: "var(--font-lux-display)" }}
            >
              {DOCUMENT_TITLES[titleIndex]}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="mt-5 space-y-2.5" style={{ transform: "translateZ(20px)" }}>
          {[92, 78, 85, 64, 71].map((w, i) => (
            <div key={i} className="h-2 rounded-full bg-white/10" style={{ width: `${w}%` }} />
          ))}
        </div>

        <div
          className="mt-6 flex items-center justify-between border-t border-white/10 pt-4"
          style={{ transform: "translateZ(24px)" }}
        >
          <p className="max-w-[65%] text-[11px] leading-relaxed text-[var(--lux-muted)] italic">
            Our process: Pure Craft. Secure Future.
          </p>
          <span className="relative flex size-8 items-center justify-center rounded-full border border-[var(--lux-border-strong)]">
            <span className="absolute inset-0 animate-ping rounded-full bg-[var(--lux-gold)]/30" />
            <span className="size-2.5 rounded-full bg-[var(--lux-gold)]" />
          </span>
        </div>

        {CLAUSE_TAGS.map((tag, i) => (
          <motion.span
            key={tag.label}
            className="absolute hidden rounded-full border border-[var(--lux-border)] bg-black/50 px-3 py-1 text-[10px] font-medium tracking-wide text-[var(--lux-bronze)] backdrop-blur-sm sm:block"
            style={{
              top: tag.top,
              left: tag.left,
              right: tag.right,
              transform: "translateZ(40px)",
            }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.4 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {tag.label}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
