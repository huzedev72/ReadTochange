import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

// Telegram Sticker SVG: 512x512 with 100% transparent background
const stickerSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Sun Gold drop shadow (offset +16px x, +16px y) -->
  <rect x="86" y="96" width="360" height="310" rx="64" fill="#FFA83A"/>
  
  <!-- White book body with thick ink outline -->
  <rect x="70" y="80" width="360" height="310" rx="64" fill="#FFFFFF" stroke="#0E0E0E" stroke-width="12" stroke-linejoin="round"/>
  
  <!-- Left book spine line -->
  <line x1="120" y1="105" x2="120" y2="365" stroke="#0E0E0E" stroke-width="10" stroke-linecap="round"/>
  
  <!-- Left Eye Outer Circle -->
  <circle cx="215" cy="215" r="44" fill="#FFFFFF" stroke="#0E0E0E" stroke-width="10"/>
  <!-- Left Eye Pupil -->
  <circle cx="222" cy="217" r="18" fill="#0E0E0E"/>
  <!-- Left Eye Highlight Catchlight -->
  <circle cx="227" cy="210" r="6" fill="#FFFFFF"/>
  
  <!-- Right Eye Outer Circle -->
  <circle cx="325" cy="215" r="44" fill="#FFFFFF" stroke="#0E0E0E" stroke-width="10"/>
  <!-- Right Eye Pupil -->
  <circle cx="332" cy="217" r="18" fill="#0E0E0E"/>
  <!-- Right Eye Highlight Catchlight -->
  <circle cx="337" cy="210" r="6" fill="#FFFFFF"/>
  
  <!-- Happy Smile Mouth -->
  <path d="M236 295 C236 335, 304 335, 304 295 Z" fill="#0E0E0E"/>
</svg>
`;

async function main() {
  const publicDir = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outPath = path.join(publicDir, "mascot_sticker.webp");

  await sharp(Buffer.from(stickerSvg))
    .resize(512, 512)
    .webp({ quality: 95, lossless: true })
    .toFile(outPath);

  const stats = fs.statSync(outPath);
  console.log("✅ Mascot sticker created successfully at:", outPath);
  console.log("📦 Dimensions: 512x512 | Size:", stats.size, "bytes");
}

main().catch(console.error);
