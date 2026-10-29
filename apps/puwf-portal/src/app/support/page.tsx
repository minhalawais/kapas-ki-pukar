import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support | Kapas ki Pukaar",
  description: "Support, correction, and deletion requests for Kapas ki Pukaar.",
};

export default function SupportPage() {
  return (
    <main className="min-h-dvh bg-[var(--page-worker)] px-4 py-10 text-ink sm:px-6">
      <article className="mx-auto max-w-2xl rounded-card border border-border bg-surface p-6 shadow-[0_18px_48px_rgba(23,35,30,0.10)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-action">Kapas ki Pukaar</p>
        <h1 className="mt-2 text-3xl font-semibold">Support and data requests</h1>
        <p className="mt-6 leading-7 text-muted">
          For help with a complaint, correction of contact details, or an access or deletion request,
          email{" "}
          <a className="font-semibold text-action underline" href="mailto:privacy@kapaskipukar.com">
            privacy@kapaskipukar.com
          </a>
          . Include the complaint reference if available and describe the request. Do not attach CNIC
          images, recordings, photographs, or other evidence to ordinary email.
        </p>
        <p className="mt-5 leading-7 text-muted">
          Anonymous complaints may not be linkable to a person. Some records may need to be retained for
          an active complaint, legal duties, safeguarding, security, or dispute resolution.
        </p>
        <Link className="mt-8 inline-block font-semibold text-action underline" href="/privacy">
          Read the privacy policy
        </Link>
      </article>
    </main>
  );
}
