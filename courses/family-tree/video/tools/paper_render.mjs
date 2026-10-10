// Renders 《一张红纸》 → out/一张红纸.mp4, loudness to −14 LUFS / −1.2 dBTP.
//   python3 tools/paper_voice.py && python3 tools/paper_timeline.py && python3 tools/paper_audio.py
//   node tools/paper_render.mjs
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'out', '一张红纸.mp4');
const tmp = out.replace(/\.mp4$/, '.raw.mp4');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.REMOTION_BROWSER ?? null});
const inputProps = {withAudio: true};
const composition = await selectComposition({serveUrl, id: 'paper', inputProps, puppeteerInstance: browser});
const t0 = Date.now();
let last = -10;
await renderMedia({
  composition, serveUrl, codec: 'h264', outputLocation: tmp, puppeteerInstance: browser, inputProps,
  concurrency: Math.max(1, os.cpus().length), crf: 19, pixelFormat: 'yuv420p', imageFormat: 'jpeg', jpegQuality: 93,
  onProgress: ({progress}) => {
    const p = Math.floor(progress * 100);
    if (p >= last + 10) { last = p; console.log(`${p}% (${((Date.now() - t0) / 1000).toFixed(0)}s)`); }
  },
});
await browser.close({silent: true});
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', tmp, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.2:LRA=11',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', out], {stdio: 'inherit'});
fs.unlinkSync(tmp);
console.log(`✓ ${path.relative(root, out)}`);
