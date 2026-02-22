import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support — Photo Pro",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">
          Support
        </h1>
        <p className="mb-8 text-sm text-[var(--muted-foreground)]">
          Photo Pro — Celtic Quest Fishing Fleet
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-[var(--foreground)]">
          <section>
            <h2 className="mb-2 text-lg font-semibold">About Photo Pro</h2>
            <p>
              Photo Pro is an internal photo management tool used by Celtic
              Quest Fishing Fleet to collect, review, and publish fishing trip
              photos. Crew members send photos via WhatsApp, and the captain
              approves them for publishing to social media.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Contact Us</h2>
            <p>
              For support, questions, or feedback, contact Celtic Quest Fishing
              Fleet:
            </p>
            <ul className="ml-4 mt-4 list-disc space-y-2">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:captdes@gmail.com"
                  className="text-[var(--primary)] underline"
                >
                  captdes@gmail.com
                </a>
              </li>
              <li>
                <strong>Website:</strong>{" "}
                <a
                  href="https://celticquestfishing.com"
                  className="text-[var(--primary)] underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  celticquestfishing.com
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Data Deletion</h2>
            <p>
              To request deletion of your data, email us at{" "}
              <a
                href="mailto:captdes@gmail.com"
                className="text-[var(--primary)] underline"
              >
                captdes@gmail.com
              </a>{" "}
              with the subject line &quot;Data Deletion Request&quot;, or visit
              our{" "}
              <a
                href="/data-deletion"
                className="text-[var(--primary)] underline"
              >
                data deletion page
              </a>{" "}
              for more information.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              Policies
            </h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <a
                  href="/privacy"
                  className="text-[var(--primary)] underline"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-[var(--primary)] underline"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
