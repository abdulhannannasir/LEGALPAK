import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQS } from "@/lib/marketing/faqs";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 scroll-mt-20 sm:px-6">
      <p className="text-center text-xs font-semibold tracking-[0.2em] text-accent uppercase">
        Questions
      </p>
      <h2 className="mt-3 text-center font-display text-3xl text-fg sm:text-4xl">
        Frequently asked questions
      </h2>

      <div className="mt-10 divide-y divide-border rounded-[var(--radius-lg)] border border-border bg-surface">
        {FAQS.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
              >
                <span className="text-sm font-medium text-fg sm:text-base">{item.question}</span>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                  strokeWidth={1.75}
                />
              </button>
              {open && (
                <div className="px-5 pb-5 sm:px-6">
                  <p className="text-sm leading-relaxed text-muted">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
