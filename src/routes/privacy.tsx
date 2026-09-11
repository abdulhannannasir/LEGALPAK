import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — LegalPak" },
      {
        name: "description",
        content:
          "How LegalPak collects, stores, and uses information — what stays in your browser, what reaches our servers, and which third parties (Google Gemini, Resend, Vercel) are involved.",
      },
    ],
  }),
});

const LAST_UPDATED = "11 September 2026";

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Legal</p>
        <h1 className="font-display text-3xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          This policy describes, plainly and specifically, what LegalPak actually does with your
          information — not a generic template. Where a tool works entirely in your browser and
          never reaches our servers, we say so.
        </p>
      </div>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">What stays in your browser</h2>
        <p className="text-sm leading-relaxed text-muted">
          Most of LegalPak's drafting tools — Contracts, Financial Statements, Citizen document
          drafts, the Help Desk wizards, the Incorporation wizard, Form 21/45, and Legal Notices —
          run entirely client-side. What you type into those forms is kept in your browser's local
          storage so your draft survives a page reload, and is never transmitted to our servers
          unless you explicitly export it (as a .txt/.docx/.pdf download or a company-profile
          .json file) or submit it through an action that says it saves to your account. Clearing
          your browser data or using a private/incognito window removes these drafts permanently —
          we have no copy to recover.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">What reaches our servers</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>
            <strong className="text-fg">Account information.</strong> If you sign in, we store your
            name, email address, and a securely hashed password (or your single sign-on identity),
            managed through our authentication provider (Better Auth).
          </li>
          <li>
            <strong className="text-fg">Company and workspace data.</strong> When you save a
            Company Profile, register directors/subscribers, or create a matter (Financial
            Statements, Form A, Form 9, Contracts, Income Tax Return), that data — company name,
            CUIN, NTN, capital structure, director/subscriber names, CNIC numbers, addresses, and
            similar details you enter — is stored in our database, scoped to your workspace.
          </li>
          <li>
            <strong className="text-fg">Citizen Legal Help chat.</strong> Messages you send to "Ask
            LegalPak AI" are stored against an anonymous or account-linked chat session so the
            conversation has context, and are sent to Google's Gemini API to generate a reply (see
            "Third parties" below). Anonymous sessions are identified only by a randomly generated,
            hashed token — we don't ask for your name or CNIC to use the chat.
          </li>
          <li>
            <strong className="text-fg">Lawyer directory listings.</strong> If you register as an
            advocate, we store your name, email, phone, bar council number, and the other listing
            details you provide, until you ask us to remove them.
          </li>
          <li>
            <strong className="text-fg">Document uploads.</strong> Files you upload to a company's
            document vault (CNIC scans, board resolutions, signed packs) are stored via Vercel
            Blob storage, linked to that company record.
          </li>
          <li>
            <strong className="text-fg">Consultation requests.</strong> If you request a
            consultation, we store the details you submit so it can be routed to counsel.
          </li>
          <li>
            <strong className="text-fg">Audit and security logs.</strong> We keep a log of
            significant actions on your account and companies (e.g. company created, matter status
            changed) for accountability and to help you and us detect unauthorized access.
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Third parties we use</h2>
        <p className="text-sm leading-relaxed text-muted">
          We don't sell your data, and we don't run any advertising or analytics trackers on this
          site. We do rely on a small number of infrastructure providers to operate LegalPak:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>
            <strong className="text-fg">Google (Gemini API)</strong> — processes the messages you
            send to the Citizen Legal Help chat in order to generate a response. Google's own
            privacy terms govern how it handles that processing.
          </li>
          <li>
            <strong className="text-fg">Vercel</strong> — hosts the application, our Postgres
            database, and Blob file storage.
          </li>
          <li>
            <strong className="text-fg">Resend</strong> — sends transactional email on our behalf
            (account verification, and compliance-deadline reminder emails for matters in your
            workspace).
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Cookies</h2>
        <p className="text-sm leading-relaxed text-muted">
          We use one first-party session cookie to keep you signed in. We do not use third-party
          advertising or cross-site tracking cookies. Browser local storage (used for in-progress
          drafts, described above) is not a cookie and is never sent to our servers automatically.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Your rights and choices</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>You can review and edit your company profile data at any time from its page.</li>
          <li>
            You can ask us to delete your account, your saved company data, or a lawyer-directory
            listing by contacting us (below) — we'll confirm what's removed and what we're
            required to retain (e.g. audit logs tied to an active legal matter).
          </li>
          <li>
            Anonymous Citizen Legal Help sessions have no account to delete, but you can stop using
            a session token at any time by simply not returning to it.
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Security</h2>
        <p className="text-sm leading-relaxed text-muted">
          Passwords are hashed, not stored in plain text. Data in transit is encrypted (HTTPS).
          Access to company data is scoped to members of that company's workspace. No system is
          perfectly secure, and we can't guarantee absolute security of information you transmit to
          us.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Children</h2>
        <p className="text-sm leading-relaxed text-muted">
          LegalPak is intended for founders, company officers, advocates, and adults seeking legal
          information. It is not directed at children, and we don't knowingly collect information
          from anyone under 18.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Changes to this policy</h2>
        <p className="text-sm leading-relaxed text-muted">
          If we materially change how we collect or use information, we'll update the "Last
          updated" date above and, where the change is significant, make a reasonable effort to
          flag it on the site.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Contact</h2>
        <p className="text-sm leading-relaxed text-muted">
          Questions about this policy, or a request to access, correct, or delete your data, can be
          made through the{" "}
          <a href="/consult" className="text-accent underline">
            Consult Counsel
          </a>{" "}
          request form.
        </p>
      </section>

      <p className="text-xs text-muted">
        This policy describes LegalPak's actual data practices in good faith; it is not itself a
        substitute for legal advice about your specific obligations under applicable data
        protection law.
      </p>
    </div>
  );
}
