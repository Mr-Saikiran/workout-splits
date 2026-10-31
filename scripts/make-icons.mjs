// Renders the app icon and splash sources into assets/ from SVG, matching the
// site's "WS" brand mark. CI then runs @capacitor/assets to make every size.
//   node scripts/make-icons.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const ORANGE = '#e8500f';
const DARK = '#0f1115';
const FONT = "font-family='Segoe UI, Roboto, Helvetica, Arial, sans-serif' font-weight='800'";

const svg = (size, body) => Buffer.from(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>${body}</svg>`);
const mark = (cx, cy, s, color) => `<text x='${cx}' y='${cy + s * 0.36}' text-anchor='middle' ${FONT} font-size='${s}' letter-spacing='${-s * 0.04}' fill='${color}'>WS</text>`;
const tile = (x, y, s) => `<rect x='${x}' y='${y}' width='${s}' height='${s}' rx='${s * 0.22}' fill='${ORANGE}'/>`;

const files = {
  // iOS and legacy Android: full-bleed square (the OS applies the corner mask).
  'icon-only.png': svg(1024, `<rect width='1024' height='1024' fill='${ORANGE}'/>${mark(512, 512, 430, '#fff')}`),
  // Android adaptive icon: mark inside the 66% safe zone, on a solid background.
  'icon-foreground.png': svg(1024, mark(512, 512, 300, '#fff')),
  'icon-background.png': svg(1024, `<rect width='1024' height='1024' fill='${ORANGE}'/>`),
  'splash.png': svg(2732, `<rect width='2732' height='2732' fill='${DARK}'/>${tile(1066, 966, 600)}${mark(1366, 1266, 250, '#fff')}
    <text x='1366' y='1780' text-anchor='middle' ${FONT} font-size='120' fill='#eceef2'>Workout Splits</text>`),
};
files['splash-dark.png'] = files['splash.png'];

await mkdir(out, { recursive: true });
for (const [name, data] of Object.entries(files)) {
  await sharp(data).png().toFile(join(out, name));
  console.log('assets/' + name);
}
