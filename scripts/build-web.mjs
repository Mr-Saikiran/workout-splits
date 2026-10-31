// Copies the static site into www/, the folder Capacitor bundles into the apps.
//   node scripts/build-web.mjs
import { cp, rm, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');

await rm(www, { recursive: true, force: true });
await mkdir(www);
for (const part of ['index.html', 'css', 'js']) await cp(join(root, part), join(www, part), { recursive: true });
console.log('www/ ready');
