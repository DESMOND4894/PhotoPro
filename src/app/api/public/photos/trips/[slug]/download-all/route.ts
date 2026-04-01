import { NextResponse } from "next/server";
import { getPublishedTripBySlug } from "@/lib/public-portal-data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const trip = await getPublishedTripBySlug(slug);
  if (!trip || trip.photos.length === 0) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  // Fetch all photos in parallel and build a zip
  const photoResults = await Promise.allSettled(
    trip.photos.map(async (photo, index) => {
      const res = await fetch(photo.url);
      if (!res.ok) return null;
      const buffer = await res.arrayBuffer();
      const ext = photo.url.includes(".png") ? "png" : "jpg";
      return {
        name: `${String(index + 1).padStart(2, "0")}-${trip.slug}.${ext}`,
        data: new Uint8Array(buffer),
      };
    })
  );

  const files = photoResults
    .filter(
      (r): r is PromiseFulfilledResult<{ name: string; data: Uint8Array }> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);

  if (files.length === 0) {
    return NextResponse.json({ error: "No photos available" }, { status: 404 });
  }

  // Build a zip file using the minimal zip format (no compression, store only)
  // This avoids needing any external dependencies
  const zipParts: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);

    // Local file header
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // compression (store)
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0, true); // mod date
    lv.setUint32(14, crc, true); // crc32
    lv.setUint32(18, file.data.length, true); // compressed size
    lv.setUint32(22, file.data.length, true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true); // filename length
    lv.setUint16(28, 0, true); // extra length
    localHeader.set(nameBytes, 30);

    zipParts.push(localHeader);
    zipParts.push(file.data);

    // Central directory entry
    const cdEntry = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cdEntry.buffer);
    cv.setUint32(0, 0x02014b50, true); // signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true); // flags
    cv.setUint16(10, 0, true); // compression
    cv.setUint16(12, 0, true); // mod time
    cv.setUint16(14, 0, true); // mod date
    cv.setUint32(16, crc, true); // crc32
    cv.setUint32(20, file.data.length, true); // compressed size
    cv.setUint32(24, file.data.length, true); // uncompressed size
    cv.setUint16(28, nameBytes.length, true); // filename length
    cv.setUint16(30, 0, true); // extra length
    cv.setUint16(32, 0, true); // comment length
    cv.setUint16(34, 0, true); // disk number
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, offset, true); // local header offset
    cdEntry.set(nameBytes, 46);

    centralDirectory.push(cdEntry);
    offset += localHeader.length + file.data.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const entry of centralDirectory) {
    zipParts.push(entry);
    cdSize += entry.length;
  }

  // End of central directory
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // signature
  ev.setUint16(4, 0, true); // disk number
  ev.setUint16(6, 0, true); // cd start disk
  ev.setUint16(8, files.length, true); // entries on disk
  ev.setUint16(10, files.length, true); // total entries
  ev.setUint32(12, cdSize, true); // cd size
  ev.setUint32(16, cdOffset, true); // cd offset
  ev.setUint16(20, 0, true); // comment length
  zipParts.push(eocd);

  // Concatenate all parts
  const totalLength = zipParts.reduce((sum, part) => sum + part.length, 0);
  const zipBuffer = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of zipParts) {
    zipBuffer.set(part, pos);
    pos += part.length;
  }

  const filename = `${trip.slug}-photos.zip`;

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}

// ─── CRC-32 (IEEE) ────────────────────────────────────────────────────────────

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
