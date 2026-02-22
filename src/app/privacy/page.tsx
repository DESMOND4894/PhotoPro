import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Photo Pro",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">
          Privacy Policy
        </h1>
        <p className="mb-8 text-sm text-[var(--muted-foreground)]">
          Photo Pro — Celtic Quest Fishing Fleet
        </p>
        <p className="mb-6 text-xs text-[var(--muted-foreground)]">
          Last updated: February 22, 2026
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-[var(--foreground)]">
          <section>
            <h2 className="mb-2 text-lg font-semibold">1. What We Do</h2>
            <p>
              Photo Pro is an internal tool used by Celtic Quest Fishing Fleet to
              manage and publish fishing trip photos. Crew members send photos
              via WhatsApp, which are reviewed and published to our social media
              accounts with AI-generated captions.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              2. Information We Collect
            </h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <strong>Photos</strong> sent by crew members via WhatsApp for
                the purpose of publishing fishing trip content.
              </li>
              <li>
                <strong>WhatsApp phone numbers</strong> of crew members who send
                photos, used solely to identify the sender.
              </li>
              <li>
                <strong>Login credentials</strong> (email and password) for
                dashboard access, managed securely through Supabase
                Authentication.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              3. How We Use Your Information
            </h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>To receive and store fishing trip photos from crew.</li>
              <li>
                To generate AI-powered captions for social media posts.
              </li>
              <li>
                To publish approved photos to Facebook, Instagram, and TikTok on
                behalf of Celtic Quest Fishing Fleet.
              </li>
              <li>To manage trip records and photo history.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              4. Data Storage & Security
            </h2>
            <p>
              All data is stored securely using Supabase (hosted on AWS). Photos
              are stored in encrypted cloud storage. We use industry-standard
              security practices including HTTPS encryption, secure
              authentication, and role-based access controls.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <strong>WhatsApp Business API</strong> (Meta) — to receive
                photos from crew members.
              </li>
              <li>
                <strong>Facebook & Instagram</strong> (Meta) — to publish
                approved trip photos.
              </li>
              <li>
                <strong>Supabase</strong> — for database, file storage, and
                authentication.
              </li>
              <li>
                <strong>Anthropic Claude</strong> — for AI caption generation.
              </li>
              <li>
                <strong>Vercel</strong> — for application hosting.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              6. Meta Platform Data Handling
            </h2>
            <p>
              Photo Pro uses Meta&apos;s WhatsApp Business Cloud API and
              Instagram API in compliance with Meta&apos;s Platform Terms and
              Developer Policies. Specifically:
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>
                Data received through Meta APIs (WhatsApp messages, media) is
                used solely for the purpose of managing and publishing fishing
                trip photos on behalf of Celtic Quest Fishing Fleet.
              </li>
              <li>
                We do not sell, license, or otherwise share Meta platform data
                with third parties.
              </li>
              <li>
                WhatsApp message content and metadata are not retained beyond
                what is necessary for photo processing and trip management.
              </li>
              <li>
                AI-generated captions are produced by Anthropic&apos;s Claude
                API. Photo data sent for caption generation is processed in
                real-time and is not stored or used for model training by
                Anthropic.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">7. Data Sharing</h2>
            <p>
              We do not sell or share personal data with third parties. Photos
              are only published to Celtic Quest Fishing Fleet&apos;s own social
              media accounts after captain approval.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">8. Data Retention & Deletion</h2>
            <p>
              Trip photos are automatically purged from our systems after 30
              days. Dashboard account records are retained while the account is
              active.
            </p>
            <p className="mt-2">
              You may request deletion of your data at any time by:
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>
                Removing the app from your Facebook or Instagram account
                settings (this triggers an automatic deletion request).
              </li>
              <li>
                Emailing us at{" "}
                <a
                  href="mailto:captdes@gmail.com"
                  className="text-[var(--primary)] underline"
                >
                  captdes@gmail.com
                </a>{" "}
                with the subject &quot;Data Deletion Request&quot;.
              </li>
              <li>
                Visiting our{" "}
                <a
                  href="/data-deletion"
                  className="text-[var(--primary)] underline"
                >
                  data deletion page
                </a>
                .
              </li>
            </ul>
            <p className="mt-2">
              All deletion requests are processed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">9. Contact</h2>
            <p>
              For questions about this privacy policy or to request data
              deletion, contact Celtic Quest Fishing Fleet at{" "}
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
