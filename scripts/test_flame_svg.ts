import fs from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";

export interface FlameGeometry {
  outer: string;
  core: string;
  heart?: string;
  faceY: number;
  faceSpacing: number;
}

export const FLAME_GEOMETRIES: Record<string, FlameGeometry> = {
  // Day 0: Extinguished Ember (resting low, squat, asleep)
  ember: {
    outer: "M32 32C40 32 50 40 52 52C54 64 44 72 32 72C20 72 10 64 12 52C14 40 24 32 32 32Z",
    core: "M32 42C37 42 43 47 44 55C45 62 40 67 32 67C24 67 19 62 20 55C21 47 27 42 32 42Z",
    faceY: 54,
    faceSpacing: 8,
  },

  // Day 1: Spark (slender, quiet, single candle teardrop)
  spark_1: {
    outer: "M32 14C34 22 43 32 45 44C47 56 42 72 32 72C22 72 17 56 19 44C21 32 30 22 32 14Z",
    core: "M32 30C34 36 39 44 39 52C39 60 36 66 32 66C28 66 25 60 25 52C25 44 30 36 32 30Z",
    heart: "M32 44C33 48 35 52 35 56C35 60 34 62 32 62C30 62 29 60 29 56C29 52 31 48 32 44Z",
    faceY: 53,
    faceSpacing: 7.5,
  },

  // Day 2: Spark (fuller candle flame)
  spark_2: {
    outer: "M32 10C35 18 45 28 47 42C49 56 43 72 32 72C21 72 15 56 17 42C19 28 29 18 32 10Z",
    core: "M32 28C34 34 40 42 40 52C40 62 36 67 32 67C28 67 24 62 24 52C24 42 30 34 32 28Z",
    heart: "M32 42C33 46 36 50 36 55C36 60 34 63 32 63C30 63 28 60 28 55C28 50 31 46 32 42Z",
    faceY: 52,
    faceSpacing: 8,
  },

  // Day 3: Kindle (Level Up! first side tongue bud appears on the right)
  kindle_day3: {
    outer: "M30 8C32 17 38 23 40 28C43 25 47 26 50 32C53 38 52 45 50 50C52 58 47 72 32 72C17 72 13 58 14 46C15 35 22 24 26 18C28 14 29 11 30 8Z",
    core: "M30 22C32 28 37 32 38 37C41 35 44 37 45 42C46 47 44 53 42 57C42 63 38 67 31 67C22 67 20 58 21 50C22 43 25 35 28 29C29 25 30 23 30 22Z",
    heart: "M30 37C32 41 35 45 36 49C37 54 35 58 31 58C26 58 25 54 26 49C27 45 29 41 30 37Z",
    faceY: 50,
    faceSpacing: 9,
  },

  // Day 4: Kindle (pronounced curling side flame, visibly taller and wider than Day 1 & Day 3)
  kindle_day4: {
    outer: "M28 5C31 15 37 20 40 25C44 20 50 21 53 28C56 35 54 44 52 50C54 59 48 73 32 73C16 73 11 59 13 46C14 33 21 21 25 15C27 10 27 7 28 5Z",
    core: "M28 18C30 25 35 29 37 34C41 31 45 33 46 39C48 45 45 52 43 56C43 63 38 68 30 68C21 68 18 58 19 49C20 41 23 33 26 26C27 21 28 19 28 18Z",
    heart: "M28 34C30 38 33 42 34 47C35 52 33 57 29 57C24 57 23 52 24 47C25 43 27 38 28 34Z",
    faceY: 49,
    faceSpacing: 10,
  },

  // Day 5: Kindle (soaring dual tongues split into two dynamic dancing flames)
  kindle_day5: {
    outer: "M25 4C28 13 30 18 32 23C34 16 39 12 43 15C48 18 52 25 52 35C55 43 54 55 48 65C42 74 24 74 16 66C10 56 10 42 14 30C17 20 22 12 25 4Z",
    core: "M26 18C28 24 30 28 32 33C34 27 37 24 41 26C44 28 45 35 45 42C46 48 44 56 40 62C35 70 24 69 19 63C15 56 16 46 18 36C21 28 24 22 26 18Z",
    heart: "M27 32C29 36 31 40 32 44C34 40 36 38 38 40C39 42 40 46 39 51C38 57 34 60 29 60C24 60 23 55 24 49C25 44 26 38 27 32Z",
    faceY: 48,
    faceSpacing: 11,
  },

  // Day 6: Kindle (maximum pre-Blaze campfire: broad waist, energetic twin dancing tongues, side licks)
  kindle_day6: {
    outer: "M23 2C27 12 30 17 33 22C35 14 41 9 46 12C51 15 55 24 55 35C58 45 56 57 49 67C43 76 23 76 14 67C8 56 8 40 12 28C16 17 21 9 23 2Z",
    core: "M25 15C28 22 30 26 33 31C35 24 39 20 43 23C47 26 48 33 48 42C49 49 47 58 42 64C36 71 24 70 18 64C13 56 14 45 17 34C20 26 23 20 25 15Z",
    heart: "M26 28C28 33 30 37 32 41C34 37 37 34 39 37C41 40 42 44 41 49C40 56 35 59 29 59C24 59 23 54 24 47C25 42 26 35 26 28Z",
    faceY: 47,
    faceSpacing: 11.5,
  },

  // Day 7-29: Blaze (roaring 3-tongued crowned fire with wide energetic base)
  blaze: {
    outer: "M32 2C34 10 37 16 40 20C44 14 49 14 52 20C55 26 55 36 54 44C57 52 54 66 44 72C34 78 16 76 10 66C4 54 8 38 13 28C16 22 20 22 23 28C26 22 30 12 32 2Z",
    core: "M32 16C33 22 36 26 38 29C41 25 44 25 46 30C48 35 47 42 46 48C48 54 45 64 38 67C30 70 19 69 16 61C12 52 14 41 18 34C20 30 23 30 25 34C28 29 30 22 32 16Z",
    heart: "M32 30C34 35 37 38 38 42C40 39 42 40 43 44C43 49 41 54 37 57C32 60 26 59 24 54C22 48 24 42 27 38C28 36 30 36 31 38C32 36 32 33 32 30Z",
    faceY: 48,
    faceSpacing: 12,
  },

  // Day 30+: Inferno (crowned solar blaze, multi-crested royal fire, spinning celestial halo)
  inferno: {
    outer: "M32 0C35 8 38 14 42 16C46 10 52 10 55 16C58 22 56 32 58 40C62 48 60 64 50 72C38 80 14 78 6 68C0 56 4 40 10 30C14 22 18 24 21 30C24 22 27 16 29 16C30 10 31 4 32 0Z",
    core: "M32 14C34 20 37 24 39 26C42 21 46 21 48 26C50 31 49 38 50 44C52 50 50 62 42 67C32 72 17 71 12 62C8 53 10 42 15 34C18 29 20 30 22 35C24 29 26 25 28 24C29 20 30 16 32 14Z",
    heart: "M32 26C34 31 36 34 38 36C40 32 43 33 44 37C45 42 44 47 42 52C38 58 27 58 22 52C19 46 21 39 24 35C26 32 27 33 28 36C29 32 30 28 32 26Z",
    faceY: 47,
    faceSpacing: 13,
  },
};

export function getFlameStageInfo(days: number, state?: string) {
  if (state === "lost" || days <= 0) {
    return { stageKey: "ember", name: "Extinguished", scale: 0.82, sparks: 0, halo: false };
  }
  if (days === 1) {
    return { stageKey: "spark_1", name: "Spark", scale: 0.92, sparks: 2, halo: false };
  }
  if (days === 2) {
    return { stageKey: "spark_2", name: "Spark", scale: 0.98, sparks: 2, halo: false };
  }
  if (days === 3) {
    return { stageKey: "kindle_day3", name: "Kindle", scale: 1.06, sparks: 3, halo: false };
  }
  if (days === 4) {
    return { stageKey: "kindle_day4", name: "Kindle", scale: 1.14, sparks: 3, halo: false };
  }
  if (days === 5) {
    return { stageKey: "kindle_day5", name: "Kindle", scale: 1.20, sparks: 4, halo: false };
  }
  if (days === 6) {
    return { stageKey: "kindle_day6", name: "Kindle", scale: 1.28, sparks: 4, halo: false };
  }
  if (days < 30) {
    const scale = days >= 14 ? 1.44 : 1.36;
    return { stageKey: "blaze", name: "Blaze", scale, sparks: 5, halo: false };
  }
  return { stageKey: "inferno", name: "Inferno", scale: 1.55, sparks: 6, halo: true };
}

function renderFlameSvg(days: number, state?: string) {
  const info = getFlameStageInfo(days, state);
  const geo = FLAME_GEOMETRIES[info.stageKey];
  const isLost = info.stageKey === "ember";

  const outerColor = isLost ? "#4A4A4A" : "#FFA83A";
  const coreColor = isLost ? "#2D2D2D" : "#FFD285";
  const heartColor = "#FFFFFF";

  const leftEyeX = 32 - geo.faceSpacing / 2;
  const rightEyeX = 32 + geo.faceSpacing / 2;

  let faceSvg = "";
  if (isLost) {
    faceSvg = `
      <path d="M${leftEyeX - 2} ${geo.faceY} Q${leftEyeX} ${geo.faceY - 2} ${leftEyeX + 2} ${geo.faceY}" stroke="#0E0E0E" stroke-width="2" fill="none" stroke-linecap="round" />
      <path d="M${rightEyeX - 2} ${geo.faceY} Q${rightEyeX} ${geo.faceY - 2} ${rightEyeX + 2} ${geo.faceY}" stroke="#0E0E0E" stroke-width="2" fill="none" stroke-linecap="round" />
      <path d="M29 ${geo.faceY + 7} C31 ${geo.faceY + 5} 33 ${geo.faceY + 5} 35 ${geo.faceY + 7}" stroke="#0E0E0E" stroke-width="2" fill="none" stroke-linecap="round" />
    `;
  } else {
    faceSvg = `
      <circle cx="${leftEyeX}" cy="${geo.faceY}" r="2.2" fill="#0E0E0E" />
      <circle cx="${rightEyeX}" cy="${geo.faceY}" r="2.2" fill="#0E0E0E" />
      <path d="M29 ${geo.faceY + 6} Q32 ${geo.faceY + 9} 35 ${geo.faceY + 6}" stroke="#0E0E0E" stroke-width="2.2" fill="none" stroke-linecap="round" />
    `;
  }

  const haloSvg = info.halo
    ? `<circle cx="32" cy="40" r="36" stroke="#FFA83A" stroke-width="2.2" stroke-dasharray="5 7" opacity="0.75" />`
    : "";

  return `
    <g transform="scale(${info.scale}) transform-origin(32 72)">
      ${haloSvg}
      <!-- Hard Shadow Offset -->
      <path d="${geo.outer}" transform="translate(3, 3)" fill="#0E0E0E" opacity="0.9" />
      <!-- Outer Flame -->
      <path d="${geo.outer}" fill="${outerColor}" stroke="#0E0E0E" stroke-width="3" stroke-linejoin="round" />
      <!-- Core -->
      <path d="${geo.core}" fill="${coreColor}" />
      ${geo.heart && !isLost ? `<path d="${geo.heart}" fill="${heartColor}" />` : ""}
      <!-- Face -->
      ${faceSvg}
    </g>
  `;
}

// Generate comparison with 8 days: Day 0, Day 1, Day 3, Day 4, Day 5, Day 6, Day 7, Day 30
const sampleDays = [
  { days: 0, label: "Day 0" },
  { days: 1, label: "Day 1" },
  { days: 3, label: "Day 3" },
  { days: 4, label: "Day 4" },
  { days: 5, label: "Day 5" },
  { days: 6, label: "Day 6" },
  { days: 7, label: "Day 7" },
  { days: 30, label: "Day 30" },
];

const cardWidth = 135;
const cardHeight = 220;
const totalWidth = sampleDays.length * cardWidth + 40;
const totalHeight = cardHeight + 60;

let cardsSvg = "";
sampleDays.forEach((item, index) => {
  const x = 20 + index * cardWidth;
  const flame = renderFlameSvg(item.days);
  const info = getFlameStageInfo(item.days);
  cardsSvg += `
    <g transform="translate(${x}, 40)">
      <rect width="125" height="210" rx="16" fill="#181818" stroke="#333333" stroke-width="2"/>
      <text x="62" y="30" font-family="sans-serif" font-weight="bold" font-size="14" fill="#FFA83A" text-anchor="middle">${item.label}</text>
      <svg x="30" y="45" width="64" height="90" viewBox="-12 -12 88 104">
        ${flame}
      </svg>
      <text x="62" y="165" font-family="sans-serif" font-weight="900" font-size="18" fill="#FFFFFF" text-anchor="middle">${item.days} ${item.days === 1 ? "day" : "days"}</text>
      <text x="62" y="185" font-family="sans-serif" font-weight="700" font-size="10" fill="#AAAAAA" text-anchor="middle" letter-spacing="1">${info.name.toUpperCase()}</text>
    </g>
  `;
});

const fullSvg = `
<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${totalWidth}" height="${totalHeight}" fill="#0E0E0E" />
  <text x="${totalWidth / 2}" y="25" font-family="sans-serif" font-weight="900" font-size="15" fill="#FFA83A" text-anchor="middle" letter-spacing="2">READTOCHANGE · STREAK FLAME GROWTH EVOLUTION</text>
  ${cardsSvg}
</svg>
`;

const outputPathSvg = path.resolve(process.cwd(), "public", "flame_progression_test.svg");
fs.writeFileSync(outputPathSvg, fullSvg);

try {
  const resvg = new Resvg(fullSvg, { fitTo: { mode: "width", value: totalWidth } });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const outputPathPng = path.resolve(process.cwd(), "public", "flame_progression_test.png");
  fs.writeFileSync(outputPathPng, pngBuffer);
  console.log("Updated PNG to", outputPathPng, "size:", pngBuffer.length);
} catch (e) {
  console.error("Resvg render error:", e);
}
