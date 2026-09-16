import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { sendChatMessageFn, type ChatTopic } from "@/lib/citizen/chat";

export const Route = createFileRoute("/citizen/chat")({
  component: CitizenChatPage,
  head: () => ({
    meta: [
      { title: "Ask LegalPak AI — LegalPak" },
      {
        name: "description",
        content:
          "Describe your legal situation in English, Roman Urdu, or Urdu and get preliminary guidance on your rights under Pakistani law — free, anonymous, and available anytime.",
      },
    ],
  }),
});

type LocalMessage = { role: "user" | "assistant"; content: string };

const TOPICS: { id: ChatTopic; label: string }[] = [
  { id: "family", label: "Family" },
  { id: "property", label: "Property / rent" },
  { id: "criminal", label: "Criminal" },
  { id: "consumer", label: "Consumer" },
  { id: "labor", label: "Labour / employment" },
  { id: "general", label: "General" },
];

function loadSession(): { sessionId: string; sessionToken: string } | null {
  try {
    const raw = window.localStorage.getItem("legalpak:citizen-chat-session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(sessionId: string, sessionToken: string) {
  try {
    window.localStorage.setItem(
      "legalpak:citizen-chat-session",
      JSON.stringify({ sessionId, sessionToken }),
    );
  } catch {
    /* localStorage unavailable — chat still works, just won't persist across reloads */
  }
}

function CitizenChatPage() {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [topic, setTopic] = useState<ChatTopic | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const session = useRef<{ sessionId: string; sessionToken: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    session.current = loadSession();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const message = input.trim();
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
          topic,
        },
      });
      session.current = { sessionId: result.sessionId, sessionToken: result.sessionToken };
      saveSession(result.sessionId, result.sessionToken);
      setMessages((m) => [...m, { role: "assistant", content: result.reply }]);
    } catch {
      toast.error("Could not reach the legal advisor — try again in a moment");
      setMessages((m) => m.slice(0, -1));
      setInput(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Citizen legal help
        </p>
        <h1 className="font-display text-3xl">Ask LegalPak AI</h1>
        <p className="mt-2 text-sm text-muted">
          Describe your situation in your own words — English, Roman Urdu, or Urdu. This gives
          preliminary guidance, not legal representation.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-danger bg-flag-high p-3 text-xs text-danger">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
        <p>
          In danger right now? Call the Police helpline <strong>15</strong> or the Ministry of Human
          Rights helpline <strong>1099</strong> — don't wait for a chat reply.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTopic(t.id === topic ? undefined : t.id)}
            className={`min-h-9 rounded-full border px-3 text-xs font-medium ${
              topic === t.id
                ? "border-primary bg-primary text-primary-fg"
                : "border-border text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[320px] space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted">
            No messages yet — describe what happened and LegalPak AI will explain your rights under
            Pakistani law and the next steps to take.
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
        {sending && <p className="mr-8 text-sm text-muted">LegalPak AI is thinking…</p>}
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
          placeholder="e.g. Mera makan malik dukan khali karwana chahta hai…"
          className="min-h-[3rem] flex-1"
        />
        <Button type="button" onClick={send} disabled={sending || !input.trim()} aria-label="Send message">
          <Send className="size-4" strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
}
