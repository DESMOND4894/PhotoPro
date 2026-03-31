import Image from "next/image";
import Link from "next/link";
import { listPublishedTrips } from "@/lib/public-portal-data";
import { formatTripDate } from "@/lib/public-portal";

export const dynamic = "force-dynamic";

function AnchorIcon() {
  return (
    <svg
      className="mx-auto h-10 w-10 text-slate-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="22" />
      <path d="M5 15c0 3.866 3.134 7 7 7s7-3.134 7-7" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default async function PhotosPage() {
  const trips = await listPublishedTrips(18);

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      {/* ─── Hero ─── */}
      <section className="bg-[linear-gradient(150deg,#0b1d2e_0%,#0e3347_45%,#0d4a52_100%)]">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pb-20 sm:pt-16 lg:px-8">
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.45em] text-amber-400">
            Celtic Quest · Port Jefferson, NY
          </p>
          <h1 className="font-display mt-5 max-w-xl text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Your Catch.<br />Your Photos.
          </h1>
          <p className="mt-6 max-w-lg font-body text-[15px] leading-7 text-white/65 sm:text-base sm:leading-8">
            Every photo the crew shot on your charter, organized by trip and ready to download. Find your charter below — free, no account needed.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {[
              { label: "Free to download", check: true },
              { label: "No account needed", check: true },
              { label: "Permanent QR destination", check: true },
            ].map(({ label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 font-body text-sm text-white/75"
              >
                <svg className="h-3.5 w-3.5 text-teal-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,6 5,9 10,3" />
                </svg>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trips Section ─── */}
      <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.4em] text-teal-700">
              Recent Charters
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              Find Your Trip
            </h2>
          </div>
          {trips.length > 0 && (
            <p className="font-body text-sm text-slate-500">
              {trips.length} published {trips.length === 1 ? "trip" : "trips"}
            </p>
          )}
        </div>

        {trips.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <AnchorIcon />
            <h3 className="font-display mx-auto mt-5 max-w-xs text-2xl font-bold text-slate-800">
              No trips published yet
            </h3>
            <p className="mx-auto mt-3 max-w-sm font-body text-sm leading-6 text-slate-500">
              Your photos will appear here once the captain publishes them after your charter. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => (
              <Link
                key={trip.slug}
                href={`/photos/trips/${trip.slug}`}
                className="group overflow-hidden rounded-3xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
              >
                {/* Cover image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                  {trip.coverPhotoUrl ? (
                    <Image
                      src={trip.coverPhotoUrl}
                      alt={trip.publicTitle}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#0b1d2e,#0f766e,#d97706)]" />
                  )}
                  {/* Bottom fade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                  {/* Badges */}
                  <div className="absolute left-3 top-3">
                    <span className="rounded-full bg-black/50 px-3 py-1 font-body text-[11px] font-semibold text-white backdrop-blur-sm">
                      {trip.timeLabel}
                    </span>
                  </div>
                  <div className="absolute right-3 top-3">
                    <span className="rounded-full bg-white/90 px-3 py-1 font-body text-[11px] font-semibold text-slate-800">
                      {trip.photoCount} photos
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-5 pb-3 pt-5">
                  <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-600">
                    {formatTripDate(trip.tripDate)}
                  </p>
                  <h3 className="font-display mt-2 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                    {trip.publicTitle}
                  </h3>
                  <p className="mt-1.5 font-body text-sm leading-6 text-slate-500">
                    {trip.publicSubtitle}
                  </p>
                  {trip.speciesTags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {trip.speciesTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-amber-50 px-2.5 py-0.5 font-body text-xs font-medium text-amber-900"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="mt-3 border-t border-slate-100 px-5 py-3">
                  <span className="font-body text-sm font-semibold text-teal-700 transition-colors group-hover:text-teal-800">
                    View gallery →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-white/50">
        <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-body text-sm font-semibold text-slate-700">
              Celtic Quest Fishing Fleet
            </p>
            <p className="font-body text-xs text-slate-400">
              Port Jefferson, Long Island, NY
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
