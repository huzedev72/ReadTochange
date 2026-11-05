import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

export interface BookStickerOptions {
  bookId: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
}

export async function generateBookCoverSticker(opts: BookStickerOptions): Promise<Buffer> {
  const cacheDir = path.join(os.tmpdir(), "rtc_stickers");
  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
  } catch (e) {}

  const cacheFile = path.join(cacheDir, `${opts.bookId}.webp`);
  try {
    if (fs.existsSync(cacheFile)) {
      return fs.readFileSync(cacheFile);
    }
  } catch (e) {}

  const width = 260;
  const height = 370;

  let coverImageBuffer: Buffer | null = null;

  if (opts.coverUrl && opts.coverUrl.startsWith("http")) {
    try {
      const res = await fetch(opts.coverUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        if (arrayBuf.byteLength > 500) {
          coverImageBuffer = Buffer.from(arrayBuf);
          console.log(`📸 Successfully loaded book cover for ${opts.title} (${coverImageBuffer.length} bytes)`);
        }
      }
    } catch (e) {
      console.warn("Could not fetch cover photo, using stylized vector fallback for:", opts.title, e);
    }
  }

  const isRealPhoto = Boolean(coverImageBuffer);

  // If no cover image was fetched, generate a stylized graphic cover using design system tokens
  if (!coverImageBuffer) {
    const safeTitle = (opts.title || "Growth Book").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const safeAuthor = (opts.author || "ReadToChange").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const fallbackSvg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#FFA83A" />
        <rect x="0" y="0" width="22" height="${height}" fill="#0E0E0E" />
        <text x="36" y="60" font-family="Poppins, Arial, sans-serif" font-weight="800" font-size="12" fill="#0E0E0E" letter-spacing="2">${safeAuthor.toUpperCase()}</text>
        <foreignObject x="36" y="90" width="200" height="200">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Playfair Display', Georgia, serif; font-size:24px; font-weight:700; color:#0E0E0E; line-height:1.2;">
            ${safeTitle}
          </div>
        </foreignObject>
        <text x="36" y="340" font-family="Poppins, Arial, sans-serif" font-weight="700" font-size="10" fill="#0E0E0E">READTOCHANGE</text>
      </svg>
    `;
    const resvg = new Resvg(fallbackSvg, { fitTo: { mode: "width", value: width } });
    coverImageBuffer = resvg.render().asPng();
  }

  // 1. Process cover image: crop/fit into width x height, round corners, add 3px ink stroke & spine strip
  const resizedCover = await sharp(coverImageBuffer)
    .resize(width, height, { fit: "cover" })
    .toBuffer();

  // SVG mask with rounded corners + ink border + spine strip (9% width)
  const overlaySvg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Outer Border -->
      <rect x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="12" fill="none" stroke="#0E0E0E" stroke-width="4" />
      <!-- Spine strip on the left -->
      <path d="M 0 12 Q 0 0 12 0 L 22 0 L 22 ${height} L 12 ${height} Q 0 ${height} 0 ${height - 12} Z" fill="rgba(14, 14, 14, 0.4)" />
      <line x1="22" y1="0" x2="22" y2="${height}" stroke="#0E0E0E" stroke-width="3" />
    </svg>
  `;

  // Rounded corners mask
  const roundedCornersMask = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="12" fill="#FFFFFF" />
    </svg>
  `);

  const maskedBook = await sharp(resizedCover)
    .composite([
      { input: roundedCornersMask, blend: "dest-in" },
      { input: Buffer.from(overlaySvg), blend: "over" },
    ])
    .png()
    .toBuffer();

  // 2. Add 8px solid Ink Hard Shadow (as per Design System: Covers: 8px offset, solid ink. Tilt -4°)
  // Base SVG for tilted book + hard shadow on 512x512 transparent canvas
  const shadowSvg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(256, 256) rotate(-4) translate(-${width / 2}, -${height / 2})">
        <!-- 8px offset Hard Shadow -->
        <rect x="8" y="8" width="${width}" height="${height}" rx="12" fill="#0E0E0E" />
      </g>
    </svg>
  `;

  const shadowBuffer = new Resvg(shadowSvg, { fitTo: { mode: "width", value: 512 } }).render().asPng();

  // Rotate the masked book by -4 degrees on a transparent background
  const rotatedBook = await sharp(maskedBook)
    .rotate(-4, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const rotatedMeta = await sharp(rotatedBook).metadata();
  const bookW = rotatedMeta.width || width;
  const bookH = rotatedMeta.height || height;

  const left = Math.round((512 - bookW) / 2);
  const top = Math.round((512 - bookH) / 2);

  // Composite: Shadow below, Tilted Book Cover above -> 100% transparent canvas!
  const finalSticker = await sharp(shadowBuffer)
    .composite([
      { input: rotatedBook, left, top, blend: "over" },
    ])
    .webp({ quality: 95, lossless: false })
    .toBuffer();

  if (isRealPhoto) {
    try {
      fs.writeFileSync(cacheFile, finalSticker);
    } catch (e) {}
  }
  return finalSticker;
}
