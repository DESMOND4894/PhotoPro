import sharp from "sharp";
import path from "path";

const WATERMARK_PATH = path.join(process.cwd(), "public", "watermark.png");

/**
 * Apply a subtle branded watermark to a photo.
 * Places a small logo in the bottom-right corner with low opacity.
 */
export async function applyWatermark(
  imageBuffer: Buffer
): Promise<Buffer> {
  try {
    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const imageWidth = metadata.width || 1200;
    const imageHeight = metadata.height || 900;

    // Scale watermark to ~8% of image width
    const watermarkWidth = Math.round(imageWidth * 0.08);

    // Resize and prepare watermark
    let watermark: Buffer;
    try {
      watermark = await sharp(WATERMARK_PATH)
        .resize(watermarkWidth)
        .ensureAlpha()
        .composite([
          {
            input: Buffer.from([255, 255, 255, Math.round(255 * 0.4)]),
            raw: { width: 1, height: 1, channels: 4 },
            tile: true,
            blend: "dest-in",
          },
        ])
        .toBuffer();
    } catch {
      // If no watermark file exists, return original image
      console.log("No watermark.png found, skipping watermark");
      return imageBuffer;
    }

    // Get watermark dimensions after resize
    const wmMeta = await sharp(watermark).metadata();
    const wmWidth = wmMeta.width || watermarkWidth;
    const wmHeight = wmMeta.height || watermarkWidth;

    // Position: bottom-right with padding
    const padding = Math.round(imageWidth * 0.02);
    const left = imageWidth - wmWidth - padding;
    const top = imageHeight - wmHeight - padding;

    // Composite watermark onto original
    const result = await sharp(imageBuffer)
      .composite([
        {
          input: watermark,
          left,
          top,
        },
      ])
      .jpeg({ quality: 92 })
      .toBuffer();

    return result;
  } catch (error) {
    console.error("Watermark application failed:", error);
    return imageBuffer; // Return original on failure
  }
}
