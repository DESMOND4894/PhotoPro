import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion — Photo Pro",
};

export default async function DataDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">
          Data Deletion Request
        </h1>
        <p className="mb-8 text-sm text-[var(--muted-foreground)]">
          Photo Pro — Celtic Quest Fishing Fleet
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-[var(--foreground)]">
          {code ? (
            <section>
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Deletion Request Received
                </p>
                <p className="mt-1 text-green-700 dark:text-green-300">
                  Confirmation code: <code className="font-mono">{code}</code>
                </p>
              </div>
              <p>
                Your data deletion request has been received and is being
                processed. All associated data (photos, trip records, and
                account information) will be permanently deleted within 30
                days.
              </p>
              <p className="mt-4">
                Photos are automatically purged from our systems after 30 days
                as part of our standard data retention policy. Any remaining
                records associated with your account will be removed as part of
                this deletion request.
              </p>
            </section>
          ) : (
            <section>
              <p>
                To request deletion of your data from Photo Pro, you can:
              </p>
              <ul className="ml-4 mt-4 list-disc space-y-2">
                <li>
                  Remove the app from your Facebook/Instagram account settings.
                  This will automatically trigger a data deletion request.
                </li>
                <li>
                  Email us directly at{" "}
                  <a
                    href="mailto:captdes@gmail.com"
                    className="text-[var(--primary)] underline"
                  >
                    captdes@gmail.com
                  </a>{" "}
                  with the subject line &quot;Data Deletion Request&quot;.
                </li>
              </ul>
              <p className="mt-4">
                All data deletion requests are processed within 30 days.
                Photos are automatically purged from our systems after 30 days
                as part of our standard data retention policy.
              </p>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-lg font-semibold">What Gets Deleted</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Photos submitted via WhatsApp</li>
              <li>Trip records and captions</li>
              <li>Phone number associations</li>
              <li>Dashboard account information (if applicable)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Contact</h2>
            <p>
              For questions about data deletion, contact Celtic Quest Fishing
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
