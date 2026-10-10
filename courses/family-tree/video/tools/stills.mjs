// Renders stills at the given times (seconds) for review, then a contact sheet.
//   node tools/stills.mjs 12 30.5 88        → out/stills/*.jpg + out/contact.jpg
//   node tools/stills.mjs --acts            → 4 frames from every act
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tl = JSON.parse(fs.readFileSync(path.join(root, 'src/timeline.json'), 'utf8'));
let times = process.argv.slice(2).filter((a) => !a.startsWith('--')).map(Number);
if (process.argv.includes('--acts')) {
  for (const a of tl.acts) for (const k of [0.15, 0.4, 0.65, 0.9]) times.push(+(a.t0 + (a.t1 - a.t0) * k).toFixed(1));
}
const outDir = path.join(root, 'out/stills');
fs.mkdirSync(outDir, {recursive: true});
for (const f of fs.readdirSync(outDir)) fs.unlinkSync(path.join(outDir, f));

const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.REMOTION_BROWSER ?? null});
const inputProps = {withAudio: false};
const composition = await selectComposition({serveUrl, id: 'Full', inputProps, puppeteerInstance: browser});
const files = [];
for (const t of times) {
  const file = path.join(outDir, `t${String(t.toFixed(1)).padStart(6, '0')}.jpg`);
  await renderStill({composition, serveUrl, output: file, frame: Math.round(t * tl.fps), inputProps,
    imageFormat: 'jpeg', jpegQuality: 85, puppeteerInstance: browser});
  files.push(file);
}
await browser.close({silent: true});
execFileSync('python3', [path.join(root, 'tools/contact_sheet.py'), path.join(root, 'out/contact.jpg'), ...files], {stdio: 'inherit'});
