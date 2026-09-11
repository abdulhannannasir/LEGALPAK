import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQS } from "@/lib/marketing/faqs";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 pb-28 scroll-mt-24">
      <p className="text-center text-xs font-medium tracking-[0.3em] text-[var(--lux-bronze)] uppercase">
        Questions
      </p>
      <h2
        className="mt-3 text-center text-3xl text-[var(--lux-fg)] sm:text-4xl"
        style={{ fontFamily: "var(--font-lux-serif)" }}
      >
        Frequently Asked Questions
      </h2>

      <div className="mt-12 divide-y divide-[var(--lux-border)] rounded-2xl border border-[var(--lux-border)] bg-white/[0.03] backdrop-blur-md">
        {FAQS.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span
                  className="text-base text-[var(--lux-fg)] sm:text-lg"
                  style={{ fontFamily: "var(--font-lux-serif)" }}
                >
                  {item.question}
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 text-[var(--lux-gold)] transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                  strokeWidth={1.75}
                />
              </button>
              {open && (
                <div className="px-6 pb-5">
                  <p className="text-sm leading-relaxed text-[var(--lux-muted)]">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
