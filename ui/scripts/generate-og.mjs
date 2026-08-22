// Genera public/og.png (1200x630) a partir de un SVG de marca.
// Uso: node scripts/generate-og.mjs
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'public', 'og.png');

const WIDTH = 1200;
const HEIGHT = 630;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="55%" stop-color="#292524"/>
      <stop offset="100%" stop-color="#431407"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.22" r="0.55">
      <stop offset="0%" stop-color="#E8532C" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#E8532C" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>

  <!-- Logo icon -->
  <g transform="translate(120, 205) scale(3)">
    <rect x="8" y="8" width="112" height="112" rx="24" fill="#E8532C"/>
    <g fill="#fff">
      <rect x="17.2" y="26" width="3.4" height="24" rx="1.7"/>
      <rect x="22.4" y="26" width="3.4" height="24" rx="1.7"/>
      <rect x="27.6" y="26" width="3.4" height="24" rx="1.7"/>
      <path d="M17.2 44H31V48C31 51 27.9 52.5 27.3 55.5V98.8C27.3 100.6 25.9 102 24.1 102C22.3 102 20.9 100.6 20.9 98.8V55.5C20.3 52.5 17.2 51 17.2 48V44Z"/>
      <path d="M99.5 33C99.5 29.1 101.7 26 104.6 26C107.5 26 109.8 29.1 110 33L110.6 53.5C110.7 58.4 108.1 61.5 104.7 61.5C101.3 61.5 98.8 58.4 98.9 53.5L99.5 33Z"/>
      <rect x="101.4" y="56" width="6.4" height="46" rx="3.2"/>
      <circle cx="64" cy="64" r="31"/>
    </g>
    <circle cx="64" cy="64" r="21" fill="none" stroke="#E8532C" stroke-width="2" opacity="0.3"/>
  </g>

  <!-- Wordmark + tagline -->
  <text x="120" y="560" font-family="Arial, Helvetica, sans-serif" font-size="76" font-weight="800" fill="#ffffff">quiero.menu</text>
  <text x="600" y="360" font-family="Arial, Helvetica, sans-serif" font-size="84" font-weight="800" fill="#ffffff">
    <tspan x="600" dy="0">Menu digital</tspan>
    <tspan x="600" dy="96" fill="#FF8A65">gratis, sin comisiones</tspan>
  </text>
  <text x="600" y="500" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="400" fill="#d6d3d1">
    Pedidos directos por WhatsApp o QR, con seguimiento en vivo.
  </text>
  <text x="600" y="560" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#E8532C">quiero.menu</text>
</svg>
`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, png);
console.log(`OG image written: ${outPath} (${png.length} bytes)`);