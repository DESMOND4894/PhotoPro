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
    <div className="min-h-screen bg-[#f1ece4]">
      <Suspense>
        <TripGallery trip={trip} />
      </Suspense>
    </div>
  );
}
