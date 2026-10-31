import * as fs from "fs";
import * as path from "path";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const outputDir = path.resolve(process.cwd(), "public", "stickers");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 512x512 canvas with mascot centered (base size 240x208 in 512 space)
// Design system tokens: Ink #0E0E0E, Sun #FFA83A, Paper #FFFFFF

function getSvg(expression: "happy" | "curious" | "thinking" | "proud" | "sleepy"): string {
  // Center: x: 136, y: 152, width: 240, height: 208
  // Scale factor = 2x from 120x104
  return `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Hard Shadow (offset 10px 10px, Sun Gold #FFA83A) -->
  <rect x="146" y="162" width="240" height="208" rx="48" fill="#FFA83A" />

  <!-- Main Body (Paper White with Ink #0E0E0E Border) -->
  <rect x="136" y="152" width="240" height="208" rx="48" fill="#FFFFFF" stroke="#0E0E0E" stroke-width="6" />

  <!-- Book Spine Line -->
  <line x1="170" y1="168" x2="170" y2="344" stroke="#0E0E0E" stroke-width="6" stroke-linecap="round" />

  ${renderExpression(expression)}
</svg>
`;
}

function renderExpression(type: string): string {
  switch (type) {
    case "happy":
      // Big open eyes with pupils, wide open smile
      return `
        <!-- Left Eye -->
        <circle cx="230" cy="220" r="28" fill="#FFFFFF" stroke="#0E0E0E" stroke-width="6" />
        <circle cx="225" cy="216" r="11" fill="#0E0E0E" />

        <!-- Right Eye -->
        <circle cx="298" cy="220" r="28" fill="#FFFFFF" stroke="#0E0E0E" stroke-width="6" />
        <circle cx="293" cy="216" r="11" fill="#0E0E0E" />

        <!-- Wide Open Smile -->
        <path d="M 232 284 A 32 32 0 0 0 296 284 Z" fill="#0E0E0E" />
      `;

    case "curious":
      // Wide circular eyes with centered pupils, small circle 'o' mouth, floating '?'
      return `
        <!-- Left Eye -->
        <circle cx="228" cy="218" r="32" fill="#FFFFFF" stroke="#0E0E0E" stroke-width="6" />
        <circle cx="228" cy="218" r="8" fill="#0E0E0E" />

        <!-- Right Eye -->
        <circle cx="300" cy="218" r="32" fill="#FFFFFF" stroke="#0E0E0E" stroke-width="6" />
        <circle cx="300" cy="218" r="8" fill="#0E0E0E" />

        <!-- Small 'o' Mouth -->
        <circle cx="264" cy="286" r="13" fill="none" stroke="#0E0E0E" stroke-width="7" />

        <!-- Floating Gold '?' -->
        <text x="372" y="148" font-family="Poppins, Arial, sans-serif" font-weight="900" font-size="52" fill="#FFA83A">?</text>
      `;

    case "thinking":
      // Eyes looking up-right, straight horizontal mouth, 3 floating gold thought bubbles
      return `
        <!-- Left Eye -->
        <circle cx="230" cy="220" r="28" fill="#FFFFFF" stroke="#0E0E0E" stroke-width="6" />
        <circle cx="236" cy="208" r="11" fill="#0E0E0E" />

        <!-- Right Eye -->
        <circle cx="298" cy="220" r="28" fill="#FFFFFF" stroke="#0E0E0E" stroke-width="6" />
        <circle cx="304" cy="208" r="11" fill="#0E0E0E" />

        <!-- Straight Firm Mouth -->
        <line x1="244" y1="288" x2="284" y2="288" stroke="#0E0E0E" stroke-width="7" stroke-linecap="round" />

        <!-- 3 Floating Thought Bubbles (Sun Gold) -->
        <circle cx="380" cy="154" r="11" fill="#FFA83A" />
        <circle cx="406" cy="126" r="16" fill="#FFA83A" />
        <circle cx="438" cy="92" r="22" fill="#FFA83A" />
      `;

    case "proud":
      // Happy curved arc eyes, huge beaming smile, 3 sparkling diamond stars
      return `
        <!-- Left Happy Arc Eye -->
        <path d="M 206 226 Q 228 198 250 226" fill="none" stroke="#0E0E0E" stroke-width="9" stroke-linecap="round" />

        <!-- Right Happy Arc Eye -->
        <path d="M 276 226 Q 298 198 320 226" fill="none" stroke="#0E0E0E" stroke-width="9" stroke-linecap="round" />

        <!-- Huge Proud Smile -->
        <path d="M 226 278 A 38 38 0 0 0 302 278 Z" fill="#0E0E0E" />

        <!-- 3 Sparkling Gold Diamond Stars -->
        <g transform="translate(100, 134) rotate(45)">
          <rect x="-12" y="-12" width="24" height="24" fill="#FFA83A" rx="3" />
        </g>
        <g transform="translate(390, 114) rotate(45)">
          <rect x="-14" y="-14" width="28" height="28" fill="#FFA83A" rx="4" />
        </g>
        <g transform="translate(416, 204) rotate(45)">
          <rect x="-11" y="-11" width="22" height="22" fill="#FFA83A" rx="3" />
        </g>
      `;

    case "sleepy":
      // Droopy sleepy eyelid lines, small yawning mouth, floating gold 'Z'
      return `
        <!-- Left Droopy Sleepy Eye -->
        <line x1="206" y1="224" x2="252" y2="224" stroke="#0E0E0E" stroke-width="8" stroke-linecap="round" />

        <!-- Right Droopy Sleepy Eye -->
        <line x1="274" y1="224" x2="320" y2="224" stroke="#0E0E0E" stroke-width="8" stroke-linecap="round" />

        <!-- Small Round Yawn Mouth -->
        <circle cx="264" cy="286" r="11" fill="#0E0E0E" />

        <!-- Floating Gold 'Z' -->
        <text x="368" y="142" font-family="Poppins, Arial, sans-serif" font-weight="900" font-size="48" fill="#FFA83A">Z</text>
        <text x="408" y="104" font-family="Poppins, Arial, sans-serif" font-weight="900" font-size="36" fill="#FFA83A">z</text>
      `;

    default:
      return "";
  }
}

async function buildAll() {
  const expressions: ("happy" | "curious" | "thinking" | "proud" | "sleepy")[] = [
    "happy",
    "curious",
    "thinking",
    "proud",
    "sleepy",
  ];

  for (const expr of expressions) {
    const svg = getSvg(expr);
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 512 } });
    const pngBuffer = resvg.render().asPng();

    const webpPath = path.join(outputDir, `mascot_${expr}.webp`);
    await sharp(pngBuffer)
      .webp({ quality: 95, lossless: true })
      .toFile(webpPath);

    console.log(`✨ Generated: mascot_${expr}.webp`);
  }
}

buildAll().catch(console.error);
