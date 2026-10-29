import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Kapas ki Pukaar",
  description: "Privacy policy for the Kapas ki Pukaar worker grievance application.",
};

const sections = [
  {
    title: "Information you choose to provide",
    body: "A complaint may contain incident details, answers to guided questions, a phone number or identity details when you choose confidential or identified reporting, voice recordings, photographs, videos, documents, and an incident or device location. You may submit anonymously and omit identity details.",
  },
  {
    title: "How information is used",
    body: "Information is used to receive and manage grievances, assess urgency, route a case to authorised staff, communicate case progress when safe contact details are supplied, protect evidence integrity, prevent abuse, and maintain service security and reliability.",
  },
  {
    title: "Device permissions",
    body: "Microphone, photo or document access, notifications, and foreground location are requested only when you choose a feature that needs them. The app does not request background location. You can deny a permission and continue with other reporting options.",
  },
  {
    title: "Sharing and access",
    body: "Complaint data is restricted to authorised case-handling and technical personnel. It may be shared with the Punjab Workers Welfare Fund and an appropriate response or safeguarding body when necessary to handle a complaint, protect a person, comply with law, or act on your instructions. It is not sold and is not used for behavioural advertising.",
  },
  {
    title: "Storage, security, and retention",
    body: "The service uses encrypted transport, access controls, audit records, and protected storage designed for sensitive grievance data. Information is retained only as long as needed for case handling, legal or safeguarding duties, dispute resolution, and security, then deleted or de-identified under the applicable retention procedure.",
  },
  {
    title: "Your choices and requests",
    body: "You can choose anonymous, confidential, or identified reporting. You may ask for access, correction, or deletion where applicable. Some information may need to be retained when required by law, safeguarding obligations, or an active complaint process. Do not use ordinary email to send evidence or highly sensitive identity information.",
  },
  {
    title: "Children and urgent danger",
    body: "The service may receive reports about child-labour or safeguarding risks, but it is not directed to children as a general consumer service. If someone is in immediate danger, contact local emergency or safeguarding services; the app is not an emergency-response service.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[var(--page-worker)] px-4 py-10 text-ink sm:px-6">
      <article className="mx-auto max-w-3xl rounded-card border border-border bg-surface p-6 shadow-[0_18px_48px_rgba(23,35,30,0.10)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-action">Kapas ki Pukaar</p>
        <h1 className="mt-2 text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted">Effective and last updated: 29 October 2026</p>
        <p className="mt-6 leading-7 text-muted">
          Kapas ki Pukaar is a worker grievance service operated for the Punjab Workers Welfare Fund,
          with technical services provided by Fruit of Sustainability (SMC-Private) Limited. This
          policy explains how information is handled in the Android application and supporting service.
        </p>

        <div className="mt-8 space-y-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-2 leading-7 text-muted">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 border-t border-border pt-7">
          <h2 className="text-xl font-semibold">Contact and privacy requests</h2>
          <p className="mt-2 leading-7 text-muted">
            Email{" "}
            <a className="font-semibold text-action underline" href="mailto:privacy@kapaskipukar.com">
              privacy@kapaskipukar.com
            </a>{" "}
            with a complaint reference when available. Never include a CNIC image, voice recording,
            or other evidence in ordinary email.
          </p>
          <p className="mt-5 text-sm text-muted">
            <Link className="font-semibold text-action underline" href="/support">
              Support and deletion requests
            </Link>
            {" · "}
            <Link className="font-semibold text-action underline" href="/login">
              Staff sign in
            </Link>
          </p>
        </section>
      </article>
    </main>
  );
}
