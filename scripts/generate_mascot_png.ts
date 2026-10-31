import * as fs from "fs";
import * as path from "path";
import { Resvg } from "@resvg/resvg-js";

// SVG representation of the ReadToChange Mascot matching the design spec
const mascotSvg = `
<svg width="400" height="340" viewBox="0 0 200 170" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Sun Gold drop shadow -->
  <rect x="33" y="27" width="146" height="126" rx="30" fill="#FFA83A"/>
  
  <!-- White book body with ink border -->
  <rect x="25" y="18" width="146" height="126" rx="30" fill="#FFFFFF" stroke="#0E0E0E" stroke-width="4.5"/>
  
  <!-- Left spine -->
  <line x1="46" y1="28" x2="46" y2="134" stroke="#0E0E0E" stroke-width="4" stroke-linecap="round"/>
  
  <!-- Left Eye -->
  <circle cx="88" cy="72" r="18" fill="#FFFFFF" stroke="#0E0E0E" stroke-width="4"/>
  <circle cx="91" cy="73" r="7.5" fill="#0E0E0E"/>
  <circle cx="93" cy="70" r="2.5" fill="#FFFFFF"/>
  
  <!-- Right Eye -->
  <circle cx="132" cy="72" r="18" fill="#FFFFFF" stroke="#0E0E0E" stroke-width="4"/>
  <circle cx="135" cy="73" r="7.5" fill="#0E0E0E"/>
  <circle cx="137" cy="70" r="2.5" fill="#FFFFFF"/>
  
  <!-- Happy Smile Mouth -->
  <path d="M96 104 C96 118, 124 118, 124 104 Z" fill="#0E0E0E"/>
</svg>
`;

async function generate() {
  const publicDir = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const resvg = new Resvg(mascotSvg, {
    fitTo: {
      mode: "width",
      value: 600,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const outPath = path.join(publicDir, "mascot_welcome.png");
  fs.writeFileSync(outPath, pngBuffer);
  console.log("✅ Mascot image generated at:", outPath, "Size:", pngBuffer.length, "bytes");
}

generate().catch(console.error);
