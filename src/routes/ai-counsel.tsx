import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Building2, Gavel, Send, Sparkles } from "lucide-react";
import { RequireSubscription } from "@/components/billing/RequireSubscription";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { sendChatMessageFn } from "@/lib/citizen/chat";
import { useCompanyContext } from "@/lib/legalpak/company-context";
import { COMPANY_TYPE_LABEL } from "@/lib/legalpak/companies";

export const Route = createFileRoute("/ai-counsel")({
  component: () => (
    <RequireSubscription>
      <AiCounselPage />
    </RequireSubscription>
  ),
  head: () => ({
    meta: [
      { title: "AI Counsel — LegalPak" },
      {
        name: "description",
        content:
          "Ask LegalPak AI Counsel about SECP filings, compliance deadlines, contracts and FBR obligations for your Pakistani company — preliminary guidance, grounded in the Companies Act 2017.",
      },
    ],
  }),
});

type LocalMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "When is Form A due after our AGM?",
  "What do we need to allot new shares to an investor?",
  "Do we need to file anything after a director resigns?",
  "What's the deadline for our income tax return this year?",
];

function loadSession(): { sessionId: string; sessionToken: string } | null {
  try {
    const raw = window.localStorage.getItem("legalpak:ai-counsel-session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(sessionId: string, sessionToken: string) {
  try {
    window.localStorage.setItem("legalpak:ai-counsel-session", JSON.stringify({ sessionId, sessionToken }));
  } catch {
    /* localStorage unavailable — chat still works, just won't persist across reloads */
  }
}

function AiCounselPage() {
  const { selectedCompany } = useCompanyContext();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const session = useRef<{ sessionId: string; sessionToken: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    session.current = loadSession();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const companyContext = selectedCompany
    ? [
        selectedCompany.name,
        selectedCompany.company_type &&
          COMPANY_TYPE_LABEL[selectedCompany.company_type as keyof typeof COMPANY_TYPE_LABEL],
        selectedCompany.cuin && `CUIN ${selectedCompany.cuin}`,
        selectedCompany.ntn && `NTN ${selectedCompany.ntn}`,
        selectedCompany.incorporation_date && `incorporated ${selectedCompany.incorporation_date}`,
      ]
        .filter(Boolean)
        .join(", ")
    : undefined;

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setSending(true);
    try {
      const result = await sendChatMessageFn({
        data: {
          sessionId: session.current?.sessionId,
          sessionToken: session.current?.sessionToken,
          message,
          topic: "corporate",
          companyContext,
        },
      });
      session.current = { sessionId: result.sessionId, sessionToken: result.sessionToken };
      saveSession(result.sessionId, result.sessionToken);
      setMessages((m) => [...m, { role: "assistant", content: result.reply }]);
    } catch {
      toast.error("Could not reach AI Counsel — try again in a moment");
      setMessages((m) => m.slice(0, -1));
      setInput(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">AI Counsel</p>
        <h1 className="font-display text-3xl">Ask about your company's compliance</h1>
        <p className="mt-2 text-sm text-muted">
          SECP filings, compliance deadlines, contracts, and FBR obligations — grounded in the
          Companies Act 2017. Preliminary guidance, not a formal legal opinion.
        </p>
        {selectedCompany && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
            <Building2 className="size-3.5 text-accent" strokeWidth={1.75} />
            Asking about {selectedCompany.name}
          </p>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-3 text-xs text-muted">
        <Gavel className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.75} />
        <p>
          Need judgment, not guidance — a dispute, restructuring, or binding opinion?{" "}
          <Link to="/consult" className="text-accent underline">
            Request a consultation
          </Link>{" "}
          with a corporate lawyer.
        </p>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="min-h-9 rounded-full border border-border px-3 text-left text-xs font-medium text-muted hover:border-accent hover:text-fg"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-[320px] space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        {messages.length === 0 && (
          <p className="flex items-start gap-2 text-sm text-muted">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.75} />
            Ask a question about SECP filings, compliance deadlines, contracts, or tax — or pick a
            suggestion above.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap rounded-[var(--radius-md)] p-3 text-sm ${
              m.role === "user" ? "ml-8 bg-primary text-primary-fg" : "mr-8 bg-bg"
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && <p className="mr-8 text-sm text-muted">AI Counsel is thinking…</p>}
        <div ref={scrollRef} />
      </div>

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="e.g. What do we need to file after allotting new shares?"
          className="min-h-[3rem] flex-1"
        />
        <Button type="button" onClick={() => send()} disabled={sending || !input.trim()} aria-label="Send message">
          <Send className="size-4" strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
}
