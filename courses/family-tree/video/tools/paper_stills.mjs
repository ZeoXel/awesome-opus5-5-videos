// 《一张红纸》review stills.
//   node tools/paper_stills.mjs            → the 4 style keyframes (paper-kf)
//   node tools/paper_stills.mjs 3.2 40 88  → frames of the film at those seconds
//   node tools/paper_stills.mjs --beats    → one frame per beat of the film
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const film = JSON.parse(fs.readFileSync(path.join(root, 'src/paper/film.json'), 'utf8'));
let times = args.filter((a) => !a.startsWith('--')).map(Number);
if (args.includes('--beats')) {
  const e = film.ev;
  times = [0.5, 1.4, 4, e.baba + 0.8, e.yeye_cut + 0.4, e.yeye + 0.6, e.nainai - 0.25, e.grand_strip_L + 1, e.bobo + 0.6, e.gugu + 1,
    e.flip + 0.7, e.mama + 1, e.yima + 1, e.tangge_cut + 0.3, e.tangge_cmp + 1, e.biaomei_tag + 0.5, e.biaodi_tag + 0.5,
    e.glow_tang + 0.6, e.glow_biao + 0.6, e.badges + 1, e.fold + 0.7, e.flow + 0.6, e.flow + 2, e.window + 0.8, e.window + 2.5, film.duration - 2]
    .map((x) => +x.toFixed(2));
}
const id = times.length ? 'paper' : 'paper-kf';
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.REMOTION_BROWSER ?? null});
const inputProps = {withAudio: false};
const composition = await selectComposition({serveUrl, id, inputProps, puppeteerInstance: browser});
const files = [];
const frames = times.length ? times.map((t) => Math.round(t * 30)) : [0, 1, 2, 3];
const outDir = path.join(root, 'out/paper-stills');
fs.mkdirSync(outDir, {recursive: true});
for (const f of fs.readdirSync(outDir)) fs.unlinkSync(path.join(outDir, f));
for (const f of frames) {
  const out = path.join(outDir, `${id}-${String(f).padStart(5, '0')}.jpg`);
  await renderStill({composition, serveUrl, output: out, frame: Math.min(f, composition.durationInFrames - 1), inputProps,
    imageFormat: 'jpeg', jpegQuality: 85, puppeteerInstance: browser});
  files.push(out);
}
await browser.close({silent: true});
execFileSync('python3', [path.join(root, 'tools/contact_sheet.py'), path.join(root, 'out/paper-contact.jpg'), ...files], {stdio: 'inherit'});
