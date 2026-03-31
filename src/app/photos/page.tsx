import Image from "next/image";
import Link from "next/link";
import { listPublishedTrips } from "@/lib/public-portal-data";
import { formatTripDate } from "@/lib/public-portal";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const trips = await listPublishedTrips(18);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7,transparent_28%),linear-gradient(180deg,#f8fafc_0%,#fffaf0_45%,#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[2.25rem] border border-white/70 bg-[linear-gradient(135deg,#0f172a,#0f766e_55%,#f59e0b)] px-6 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:px-8 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/65">
            Celtic Quest
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Find Your Trip Photos
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">
            Scan once, find your recent charter fast, and download the photos you want to keep.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/80">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
              Permanent QR destination
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
              Recent trips first
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
              Mobile download ready
            </span>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Public Trips
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Recent charters
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Published trips only
            </p>
          </div>

          {trips.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">No public trips yet</h3>
              <p className="mt-2 text-sm text-slate-600">
                The crew workflow is still active. Public trip publishing just has not been enabled yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {trips.map((trip) => (
                <Link
                  key={trip.slug}
                  href={`/photos/trips/${trip.slug}`}
                  className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] bg-slate-200">
                    {trip.coverPhotoUrl ? (
                      <Image
                        src={trip.coverPhotoUrl}
                        alt={trip.publicTitle}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a,#0f766e,#f59e0b)]" />
                    )}
                    <div className="absolute inset-x-4 top-4 flex justify-between gap-2">
                      <span className="rounded-full bg-slate-950/70 px-3 py-1 text-xs font-medium text-white">
                        {trip.timeLabel}
                      </span>
                      <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-900">
                        {trip.photoCount} photos
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                      {trip.boatLabel}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      {trip.publicTitle}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {trip.publicSubtitle}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{formatTripDate(trip.tripDate)}</span>
                      {trip.speciesTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-900"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 px-5 py-4">
                    <span className="text-sm font-medium text-teal-700">
                      View photos
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
