import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const src = readFileSync(join(publicDir, 'icon.svg'), 'utf8');

// Reduce the white logo artwork to ~78% so it sits comfortably inside the icon
// (Android maskable icons scale the artwork aggressively and it was overflowing).
const reduced = src
  .replace('<g fill="#fff">', '<g fill="#fff" transform="translate(64 64) scale(0.78) translate(-64 -64)">')
  .replace(
    '<circle cx="64" cy="64" r="21" fill="none" stroke="#E8532C" stroke-width="2" opacity="0.3"/>',
    '<g transform="translate(64 64) scale(0.78) translate(-64 -64)"><circle cx="64" cy="64" r="21" fill="none" stroke="#E8532C" stroke-width="2" opacity="0.3"/></g>'
  );

// Maskable: background fills the whole square (no rounded margin), logo centered
// within the safe zone (>=80%). The artwork is already reduced above.
const maskable = reduced
  .replace('x="8" y="8" width="112" height="112" rx="24"', 'x="0" y="0" width="128" height="128" rx="0"');

async function main() {
  const jobs = [
    ['icon-192.png', 192, reduced],
    ['icon-512.png', 512, reduced],
    ['icon-maskable-512.png', 512, maskable],
    ['apple-touch-icon.png', 180, reduced],
  ];
  for (const [name, size, svg] of jobs) {
    const buf = await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();
    writeFileSync(join(publicDir, name), buf);
    console.log(`generated ${name} (${size}x${size})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
