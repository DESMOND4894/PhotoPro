import { NextResponse } from "next/server";
import { getPublishedPhotoDownloadUrl } from "@/lib/public-portal-data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const downloadUrl = await getPublishedPhotoDownloadUrl(photoId);

  if (!downloadUrl) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  return NextResponse.redirect(downloadUrl);
}
