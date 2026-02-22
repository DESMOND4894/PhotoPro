import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Photo Pro",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">
          Terms of Service
        </h1>
        <p className="mb-8 text-sm text-[var(--muted-foreground)]">
          Photo Pro — Celtic Quest Fishing Fleet
        </p>
        <p className="mb-6 text-xs text-[var(--muted-foreground)]">
          Last updated: February 22, 2026
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-[var(--foreground)]">
          <section>
            <h2 className="mb-2 text-lg font-semibold">1. Overview</h2>
            <p>
              Photo Pro is an internal tool operated by Celtic Quest Fishing
              Fleet for managing and publishing fishing trip photos to social
              media. By using this application, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">2. Use of Service</h2>
            <p>
              This application is intended for authorized crew members and
              administrators of Celtic Quest Fishing Fleet. Access is granted
              by invitation only. You agree to use the service only for its
              intended purpose of managing and publishing fishing trip photos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">3. Content</h2>
            <p>
              Photos submitted through WhatsApp become the property of Celtic
              Quest Fishing Fleet for use in marketing and social media. By
              sending photos to the Photo Pro WhatsApp number, you grant Celtic
              Quest Fishing Fleet permission to edit, caption, and publish those
              photos on its social media channels.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              4. Account Security
            </h2>
            <p>
              Dashboard users are responsible for maintaining the security of
              their login credentials. Do not share your password with
              unauthorized individuals.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              5. Third-Party Services
            </h2>
            <p>
              Photo Pro integrates with third-party services including WhatsApp,
              Facebook, Instagram, and TikTok. Your use of those platforms is
              subject to their respective terms of service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              6. Limitation of Liability
            </h2>
            <p>
              Photo Pro is provided &quot;as is&quot; without warranty. Celtic
              Quest Fishing Fleet is not liable for any damages arising from the
              use of this application, including but not limited to lost photos,
              failed posts, or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">7. Changes</h2>
            <p>
              We may update these terms from time to time. Continued use of the
              service constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">8. Contact</h2>
            <p>
              For questions about these terms, contact Celtic Quest Fishing
              Fleet at{" "}
              <a
                href="mailto:captdes@gmail.com"
                className="text-[var(--primary)] underline"
              >
                captdes@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
