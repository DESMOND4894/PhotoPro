import CryptoJS from "crypto-js";

/**
 * Compute a perceptual-style hash for duplicate detection.
 * Uses SHA-256 of the image buffer as a reliable content hash.
 * Two identical images will always produce the same hash.
 */
export function computeImageHash(imageBuffer: Buffer): string {
  const wordArray = CryptoJS.lib.WordArray.create(imageBuffer);
  return CryptoJS.SHA256(wordArray).toString();
}
