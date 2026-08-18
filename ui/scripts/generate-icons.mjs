import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const src = readFileSync(join(publicDir, 'icon.svg'), 'utf8');

// Maskable: background fills the whole square (no rounded margin), logo centered
// within the safe zone (>=80%). We take the icon artwork and scale it up.
const maskable = src
  .replace('x="8" y="8" width="112" height="112" rx="24"', 'x="0" y="0" width="128" height="128" rx="0"')
  .replace(/<circle cx="64" cy="64" r="31"\/>/, '<circle cx="64" cy="64" r="31"/>')
  // scale the logo group so it fills ~88% of the canvas for maskable safe zone
  .replace(
    '<g fill="#fff">',
    '<g fill="#fff" transform="translate(64 64) scale(1.42) translate(-64 -64)">'
  );

async function main() {
  const jobs = [
    ['icon-192.png', 192, src],
    ['icon-512.png', 512, src],
    ['icon-maskable-512.png', 512, maskable],
    ['apple-touch-icon.png', 180, src],
  ];
  for (const [name, size, svg] of jobs) {
    const buf = await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();
    writeFileSync(join(publicDir, name), buf);
    console.log(`generated ${name} (${size}x${size})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
