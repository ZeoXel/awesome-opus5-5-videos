// Renders the 《一张红纸》 style keyframes: out/paper-kf-1..4.png + out/paper-contact.jpg
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.REMOTION_BROWSER ?? null});
const composition = await selectComposition({serveUrl, id: 'paper-kf', puppeteerInstance: browser});
const files = [];
for (let f = 0; f < 4; f++) {
  const out = path.join(root, `out/paper-kf-${f + 1}.png`);
  await renderStill({composition, serveUrl, output: out, frame: f, puppeteerInstance: browser});
  files.push(out);
}
await browser.close({silent: true});
execFileSync('python3', [path.join(root, 'tools/contact_sheet.py'), path.join(root, 'out/paper-contact.jpg'), ...files], {stdio: 'inherit'});
