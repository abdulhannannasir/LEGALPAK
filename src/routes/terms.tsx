import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — LegalPak" },
      {
        name: "description",
        content:
          "The terms governing use of LegalPak — what the drafting tools are (and aren't), account responsibilities, the lawyer directory, fees, and liability.",
      },
    ],
  }),
});

const LAST_UPDATED = "12 September 2026";

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Legal</p>
        <h1 className="font-display text-3xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          By using LegalPak, you agree to these terms. If you don't agree, please don't use the
          site. See also our{" "}
          <a href="/privacy" className="text-accent underline">
            Privacy Policy
          </a>
          , which governs how we handle your information.
        </p>
      </div>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">What LegalPak is — and isn't</h2>
        <p className="text-sm leading-relaxed text-muted">
          LegalPak is a drafting and preparation desk. It generates execution-ready document packs
          (MOA, AOA, Form 28, Form 21, Form 45, contracts, legal notices, and more) and gives
          guidance on Pakistani statutory processes, but:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>
            LegalPak is <strong className="text-fg">not a law firm</strong> and does not provide
            legal representation. Using the site does not create a lawyer-client relationship
            between you and LegalPak.
          </li>
          <li>
            LegalPak has <strong className="text-fg">no filing integration</strong> with SECP,
            FBR, or any other government portal. Every document we generate is submitted and
            PIN-signed by you (or your authorized officer) directly on the relevant government
            system — we don't file anything on your behalf.
          </li>
          <li>
            Fee estimates, name-availability checks, and statutory deadlines shown in the app are{" "}
            <strong className="text-fg">indicative</strong>, based on our understanding of
            published rules at the time of writing. Always confirm the current, authoritative
            figures on the relevant government portal before relying on them or making a payment.
          </li>
          <li>
            The Citizen Legal Help chat is powered by a third-party AI model (Google's Gemini) and
            gives <strong className="text-fg">preliminary, general guidance</strong>, not legal
            advice tailored to your situation. Do not rely on it as a substitute for a licensed
            advocate, particularly in a matter with real deadlines, penalties, or in-person
            proceedings.
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Accounts</h2>
        <p className="text-sm leading-relaxed text-muted">
          You're responsible for the accuracy of the information you enter (company details,
          director/subscriber information, and so on) and for keeping your account credentials
          confidential. You're responsible for activity that happens under your account. Tell us
          promptly if you believe your account has been compromised.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Acceptable use</h2>
        <p className="text-sm leading-relaxed text-muted">You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>Use LegalPak to prepare or submit documents you know to be false or fraudulent.</li>
          <li>
            Enter another person's personal information (CNIC, address, financial details) without
            their knowledge and consent, except where you are their authorized director, partner,
            or representative acting in that capacity.
          </li>
          <li>
            Scrape, reverse-engineer, or programmatically access the site outside normal browser
            use, or attempt to interfere with its normal operation.
          </li>
          <li>
            Use the Help Desk emergency-helpline information as a substitute for actually calling
            emergency services when you are in immediate danger.
          </li>
          <li>Impersonate a licensed advocate on the lawyer directory if you are not one.</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">The lawyer directory</h2>
        <p className="text-sm leading-relaxed text-muted">
          Advocates list themselves on the directory by submitting their own bar council number,
          court level, and other details; a listing is only shown to visitors once marked
          "verified." Verification confirms the details you can see on the listing were reviewed —
          it is not an ongoing guarantee of an advocate's good standing, availability, or the
          outcome of any matter you engage them for. Any agreement you reach with an advocate
          (fees, scope of work, confidentiality) is between you and them; LegalPak is not a party
          to it and is not responsible for the advocate's conduct or advice.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Fees</h2>
        <p className="text-sm leading-relaxed text-muted">
          Citizen Legal Help and the Help Desk & Rights Navigator are free. The Corporate Suite
          (Financial Statements, Form A, Form 9, Contracts, Incorporation, Form 21/45, Legal
          Notices, the Tax Assistant, and the Compliance Calendar) requires an active subscription
          of PKR 3,000 per month per workspace, paid by manual EasyPaisa transfer — see{" "}
          <a href="/billing" className="text-accent underline">
            Billing
          </a>{" "}
          for the current process. Because this is a manual transfer rather than an automated
          payment gateway, activation happens once we've verified your transfer, not instantly on
          submission; contact us if a payment isn't reflected within a reasonable time. Where the
          site connects you to a person — an advocate via Consult Counsel or the lawyer directory —
          that advocate's own consultation fee applies separately and is shown before you book.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Your content, our platform</h2>
        <p className="text-sm leading-relaxed text-muted">
          You own the documents you generate and the information you enter. You grant us the
          limited right to store and process that information as needed to provide the service
          (for example, so a saved Company Profile can feed Financial Statements, Form A, Form 9,
          and Contracts matters for it). The LegalPak name, branding, and the underlying
          application — as distinct from the documents you generate with it — remain ours.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Disclaimer of warranties</h2>
        <p className="text-sm leading-relaxed text-muted">
          LegalPak is provided "as is." We don't warrant that the generated documents are complete,
          error-free, or sufficient for your specific circumstances, that name-availability checks
          or fee estimates will match SECP's own determination, or that the site will be
          uninterrupted or free of defects. You are responsible for reviewing every document before
          you sign, file, or send it, and for confirming statutory figures against the primary
          government source.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Limitation of liability</h2>
        <p className="text-sm leading-relaxed text-muted">
          To the maximum extent permitted by law, LegalPak and its operators are not liable for
          indirect, incidental, or consequential damages arising from your use of the site,
          including a rejected filing, a missed deadline, or reliance on a fee estimate,
          name-availability check, or AI-generated response. Nothing in these terms limits
          liability that cannot be limited under applicable law.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Termination</h2>
        <p className="text-sm leading-relaxed text-muted">
          You can stop using LegalPak, or ask us to delete your account, at any time. We may
          suspend or terminate access for a violation of the acceptable-use terms above, or where
          we reasonably believe an account is being used fraudulently.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Changes to these terms</h2>
        <p className="text-sm leading-relaxed text-muted">
          We may update these terms as the product changes. We'll update the "Last updated" date
          above, and for a material change we'll make a reasonable effort to flag it on the site.
          Continuing to use LegalPak after a change takes effect means you accept the updated
          terms.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Governing law</h2>
        <p className="text-sm leading-relaxed text-muted">
          These terms are governed by the laws of Pakistan, without regard to conflict-of-law
          principles.
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display text-lg">Contact</h2>
        <p className="text-sm leading-relaxed text-muted">
          Questions about these terms can be made through the{" "}
          <a href="/consult" className="text-accent underline">
            Consult Counsel
          </a>{" "}
          request form.
        </p>
      </section>

      <p className="text-xs text-muted">
        These terms describe LegalPak's actual product and practices in good faith; they are not
        themselves a substitute for independent legal advice about your specific rights and
        obligations.
      </p>
    </div>
  );
}
