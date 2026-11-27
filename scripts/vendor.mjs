// Copies the PDF libraries (MIT) into js/vendor/, so the site needs no build step.
//   node scripts/vendor.mjs   (after npm install)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendor = join(root, 'js', 'vendor');
await mkdir(vendor, { recursive: true });
for (const [from, to] of [
  ['node_modules/jspdf/dist/jspdf.umd.min.js', 'jspdf.umd.min.js'],
  ['node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.min.js', 'jspdf.plugin.autotable.min.js'],
]) {
  const code = (await readFile(join(root, from), 'utf8')).replace(/\n?\/\/# sourceMappingURL=.*$/m, '');
  await writeFile(join(vendor, to), code);
  console.log('js/vendor/' + to);
}
