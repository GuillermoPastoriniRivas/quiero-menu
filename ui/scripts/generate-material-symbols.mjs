import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'src/components/ui/material-symbols.tsx');
const outlinedDir = join(root, 'node_modules/@material-symbols/svg-400/outlined');
const iconifyPath = join(root, 'node_modules/@iconify-json/material-symbols/icons.json');

const ICON_NAME = /^[a-z][a-z0-9_]*$/;

function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry) && !full.endsWith('material-symbols.tsx')) out.push(full);
  }
  return out;
}

function usedNames() {
  const names = new Set();
  const add = (name) => {
    if (ICON_NAME.test(name)) names.add(name);
  };
  for (const file of sourceFiles(join(root, 'src'))) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/<MaterialIcon[^>]*?\bname=\{?["'`]([a-z0-9_]+)["'`]\}?/g)) add(m[1]);
    for (const m of src.matchAll(/\bname=\{([^}]+)\}/g)) {
      for (const q of m[1].matchAll(/["'`]([a-z][a-z0-9_]+)["'`]/g)) add(q[1]);
    }
    for (const m of src.matchAll(/\b(?:icon|badgeIcon|iconName|doneIcon)\s*[:=]\s*\{?["'`]([a-z][a-z0-9_]+)["'`]/g)) add(m[1]);
    for (const m of src.matchAll(/\[\s*["'`]([a-z][a-z0-9_]+)["'`]\s*,\s*["'`][A-ZÁÉÍÓÚ¿]/g)) add(m[1]);
  }
  return names;
}

function fromMaterialSymbols(name) {
  const base = join(outlinedDir, `${name}.svg`);
  if (!existsSync(base)) return null;
  const parse = (file) => {
    const svg = readFileSync(file, 'utf8');
    const vb = svg.match(/viewBox="([^"]+)"/)?.[1];
    const d = [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]).join(' ');
    return vb && d ? { vb, d } : null;
  };
  const outline = parse(base);
  if (!outline) return null;
  const fillFile = join(outlinedDir, `${name}-fill.svg`);
  const filled = existsSync(fillFile) ? parse(fillFile) : null;
  return { vb: outline.vb, d: outline.d, fill: filled && filled.d !== outline.d ? filled.d : undefined };
}

function fromIconify(name, iconify) {
  if (!iconify) return null;
  const kebab = name.replace(/_/g, '-');
  const icon = iconify.icons[`${kebab}-outline`] ?? iconify.icons[kebab];
  if (!icon) return null;
  const d = [...icon.body.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]).join(' ');
  if (!d) return null;
  const width = icon.width ?? iconify.width ?? 24;
  const height = icon.height ?? iconify.height ?? 24;
  return { vb: `0 0 ${width} ${height}`, d, fill: undefined };
}

function existingEntries(src) {
  const entries = new Map();
  for (const m of src.matchAll(/^\s+"([a-z0-9_]+)": (\{ vb: .*\}),?$/gm)) entries.set(m[1], m[2]);
  return entries;
}

const current = readFileSync(target, 'utf8');
const startMarker = 'export const MATERIAL_SYMBOL_PATHS = {';
const endMarker = '} as const;';
const startIndex = current.indexOf(startMarker);
const head = current.slice(0, startIndex);
const tail = current.slice(current.indexOf(endMarker, startIndex));
const existing = existingEntries(current);
const iconify = existsSync(iconifyPath) ? JSON.parse(readFileSync(iconifyPath, 'utf8')) : null;

const names = usedNames();
names.add('error');
const lines = [];
const unresolved = [];
for (const name of [...names].sort()) {
  const icon = fromMaterialSymbols(name) ?? fromIconify(name, iconify);
  if (icon) {
    const fill = icon.fill === undefined ? 'undefined' : JSON.stringify(icon.fill);
    lines.push(`  "${name}": { vb: ${JSON.stringify(icon.vb)}, d: ${JSON.stringify(icon.d)}, fill: ${fill} },`);
  } else if (existing.has(name)) {
    lines.push(`  "${name}": ${existing.get(name)},`);
  } else {
    unresolved.push(name);
  }
}

writeFileSync(target, `${head}${startMarker}\n${lines.join('\n')}\n${tail}`);
console.log(`material symbols: ${lines.length} icons written`);
if (unresolved.length > 0) console.log(`not icons (skipped): ${unresolved.join(', ')}`);
