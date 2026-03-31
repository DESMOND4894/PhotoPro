import Link from "next/link";
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#fde68a,transparent_18%),linear-gradient(180deg,#f8fafc_0%,#fffaf0_40%,#f8fafc_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <Link
            href="/photos"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Back to recent trips
          </Link>
        </div>
        <TripGallery trip={trip} />
      </div>
    </main>
  );
}
