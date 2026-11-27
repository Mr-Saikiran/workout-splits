// Builds every logo, favicon, app icon and splash image from assets/logo-source.png.
// The logo's fist and dumbbell are white, so it always sits on a dark tile.
//   node scripts/make-icons.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'assets');
const img = join(root, 'img');
const DARK = '#14171c';
const SPLASH = '#0f1115';

const logo = await sharp(join(assets, 'logo-source.png')).trim({ threshold: 1 }).png().toBuffer();

// The logo scaled to fit `size` × `size`, transparent around it.
const fitted = (size) => sharp(logo).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

const canvas = (size, background, rounded) => {
  const r = rounded ? size * 0.22 : 0;
  return sharp(Buffer.from(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='${size}' height='${size}' rx='${r}' fill='${background}'/></svg>`));
};

// Logo centred on a square background, taking up `scale` of its width.
async function tile(size, scale, background, rounded) {
  const inner = Math.round(size * scale);
  const offset = Math.round((size - inner) / 2);
  return canvas(size, background, rounded).composite([{ input: await fitted(inner), left: offset, top: offset }]).png();
}

const out = [
  // Web: header mark, favicons, home-screen icon.
  [join(img, 'logo.png'), sharp(logo).resize(512, 512, { fit: 'inside' }).png()],
  [join(img, 'logo-tile.png'), await tile(256, 0.86, DARK, true)],
  [join(img, 'favicon-32.png'), await tile(32, 0.92, DARK, true)],
  [join(img, 'favicon-192.png'), await tile(192, 0.88, DARK, true)],
  [join(img, 'apple-touch-icon.png'), await tile(180, 0.82, DARK, false)],
  // Capacitor sources (CI turns these into every Android / iOS size).
  [join(assets, 'icon-only.png'), await tile(1024, 0.8, DARK, false)],
  [join(assets, 'icon-foreground.png'), sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await fitted(600), left: 212, top: 212 }]).png()],
  [join(assets, 'icon-background.png'), canvas(1024, DARK, false).png()],
];

const splash = await canvas(2732, SPLASH, false).composite([
  { input: await fitted(1000), left: 866, top: 760 },
  { input: Buffer.from(`<svg xmlns='http://www.w3.org/2000/svg' width='2732' height='200'><text x='1366' y='140' text-anchor='middle' font-family='Segoe UI, Roboto, Helvetica, Arial, sans-serif' font-weight='800' font-size='120' fill='#eceef2'>Workout Splits</text></svg>`), left: 0, top: 1820 },
]).png().toBuffer();
out.push([join(assets, 'splash.png'), sharp(splash)], [join(assets, 'splash-dark.png'), sharp(splash)]);

await mkdir(img, { recursive: true });
for (const [file, image] of out) {
  await image.toFile(file);
  console.log(file.slice(root.length + 1).replace(/\\/g, '/'));
}
