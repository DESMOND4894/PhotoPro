import Image from "next/image";
import Link from "next/link";
import { listPublishedTrips } from "@/lib/public-portal-data";
import { formatTripDate } from "@/lib/public-portal";
import { PhotosSearch } from "@/components/public/photos-search";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const trips = await listPublishedTrips(30);

  return (
    <div className="min-h-screen bg-[#f1ece4]">
      {/* ─── Hero with fleet photo ─── */}
      <section className="relative overflow-hidden" style={{ height: "clamp(320px, 50vw, 480px)" }}>
        <div className="absolute inset-0">
          <Image
            src="/images/fleet-hero.jpg"
            alt="Celtic Quest Fleet at Port Jefferson Harbor"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(11,29,46,0.55)] to-[rgba(11,29,46,0.88)]" />
        </div>
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-5 pb-10 lg:px-8">
          <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-amber-400">
            Celtic Quest Fishing Fleet
          </p>
          <h1 className="font-heading mt-2 text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[1.08] text-white">
            Celtic Fleet<br />Photo Gallery
          </h1>
          <p className="mt-3 max-w-lg font-sans text-[0.95rem] leading-7 text-white/55">
            Every photo the crew shot on your charter — organized by trip and ready to download.
            Find your trip below.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Free to download", "No account needed", "Port Jefferson, NY"].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 font-sans text-[0.75rem] font-medium text-white/70"
              >
                <svg className="h-3 w-3 text-teal-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,6 5,9 10,3" />
                </svg>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Search + Filter + Trip Grid (client component) ─── */}
      <PhotosSearch trips={trips} />

      {/* ─── Bottom action bar ─── */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-5 pb-12 sm:grid-cols-2 lg:px-8">
        <a
          href={process.env.PHOTO_PORTAL_DEFAULT_REVIEW_URL || "#"}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 px-6 py-5 transition-transform hover:-translate-y-0.5"
        >
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] bg-amber-900/10 text-amber-800">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
          <div>
            <p className="font-sans text-[0.95rem] font-bold text-amber-950">Leave a Review</p>
            <p className="font-sans text-[0.78rem] text-amber-950/60">Tell us how your charter went</p>
          </div>
        </a>
        <a
          href={process.env.PHOTO_PORTAL_DEFAULT_BOOK_AGAIN_URL || "#"}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#0b1d2e] to-[#134e5e] px-6 py-5 text-white transition-transform hover:-translate-y-0.5"
        >
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-teal-300">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="4.5" r="1.5" />
              <line x1="10" y1="6" x2="10" y2="18" />
              <path d="M5 11c0 3.314 2.239 5 5 5s5-1.686 5-5" />
              <line x1="4" y1="9" x2="16" y2="9" />
            </svg>
          </span>
          <div>
            <p className="font-sans text-[0.95rem] font-bold">Book Your Next Trip</p>
            <p className="font-sans text-[0.78rem] text-white/55">Head back out on the water</p>
          </div>
        </a>
      </div>

      {/* ─── Footer ─── */}
      <footer className="border-t border-black/8 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <p className="font-sans text-sm font-semibold text-slate-600">Celtic Quest Fishing Fleet</p>
          <p className="font-sans text-xs text-slate-400">Port Jefferson, Long Island, NY</p>
        </div>
      </footer>
    </div>
  );
}
