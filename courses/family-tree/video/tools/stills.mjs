// Renders review stills and a contact sheet.
//   node tools/stills.mjs ep1 12 30.5 88   → out/stills/ep1-*.jpg + out/contact.jpg
//   node tools/stills.mjs ep2 --shots      → two frames from every shot of ep2
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [id, ...rest] = process.argv.slice(2);
const ep = JSON.parse(fs.readFileSync(path.join(root, `src/episodes/${id}.json`), 'utf8'));
let times = rest.filter((a) => !a.startsWith('--')).map(Number);
if (rest.includes('--shots')) {
  for (const s of ep.shots) for (const k of [0.3, 0.75]) times.push(+(s.t0 + (s.t1 - s.t0) * k).toFixed(1));
}
const outDir = path.join(root, 'out/stills');
fs.mkdirSync(outDir, {recursive: true});
for (const f of fs.readdirSync(outDir)) fs.unlinkSync(path.join(outDir, f));

const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.REMOTION_BROWSER ?? null});
const inputProps = {n: Number(id.slice(2)) - 1, withAudio: false};
const composition = await selectComposition({serveUrl, id, inputProps, puppeteerInstance: browser});
const files = [];
for (const t of times) {
  const file = path.join(outDir, `${id}-t${String(t.toFixed(1)).padStart(6, '0')}.jpg`);
  await renderStill({composition, serveUrl, output: file, frame: Math.min(composition.durationInFrames - 1, Math.round(t * 30)),
    inputProps, imageFormat: 'jpeg', jpegQuality: 85, puppeteerInstance: browser});
  files.push(file);
}
await browser.close({silent: true});
execFileSync('python3', [path.join(root, 'tools/contact_sheet.py'), path.join(root, 'out/contact.jpg'), ...files], {stdio: 'inherit'});
