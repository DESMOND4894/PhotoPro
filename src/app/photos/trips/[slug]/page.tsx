import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPublishedTripBySlug } from "@/lib/public-portal-data";
import { TripGallery } from "@/components/public/trip-gallery";

export const dynamic = "force-dynamic";

export default async function PublicTripPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const trip = await getPublishedTripBySlug(slug);

  if (!trip) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
        <Link
          href="/photos"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 font-sans text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-400 hover:text-slate-800"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8,2 4,6 8,10" />
          </svg>
          All trips
        </Link>
      </div>
      <Suspense>
        <TripGallery trip={trip} />
      </Suspense>
    </div>
  );
}
