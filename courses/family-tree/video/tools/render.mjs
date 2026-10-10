// Renders the three episodes of 豆豆拜年记 and normalises loudness to
// −16 LUFS (EBU R128) for classroom speakers.
//   node tools/render.mjs            → out/豆豆拜年记-第1集-去爷爷家拜年.mp4 …
//   node tools/render.mjs ep2        → one episode only
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'out');
fs.mkdirSync(out, {recursive: true});
const only = process.argv.slice(2);
const ids = (only.length ? only : ['ep1', 'ep2', 'ep3']);

const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.REMOTION_BROWSER ?? null});

for (const id of ids) {
  const ep = JSON.parse(fs.readFileSync(path.join(root, `src/episodes/${id}.json`), 'utf8'));
  const name = `豆豆拜年记-${ep.title.replace(/\s+/g, '-').replace(/　/g, '-')}.mp4`;
  const file = path.join(out, name);
  const tmp = file.replace(/\.mp4$/, '.raw.mp4');
  const inputProps = {n: Number(id.slice(2)) - 1, withAudio: true};
  const composition = await selectComposition({serveUrl, id, inputProps, puppeteerInstance: browser});
  const t0 = Date.now();
  let last = -10;
  await renderMedia({
    composition, serveUrl, codec: 'h264', outputLocation: tmp, puppeteerInstance: browser, inputProps,
    concurrency: Math.max(1, os.cpus().length), crf: 20, pixelFormat: 'yuv420p', imageFormat: 'jpeg', jpegQuality: 92,
    onProgress: ({progress}) => {
      const pct = Math.floor(progress * 100);
      if (pct >= last + 10) { last = pct; console.log(`${id}: ${pct}% (${((Date.now() - t0) / 1000).toFixed(0)}s)`); }
    },
  });
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', tmp, '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', file], {stdio: 'inherit'});
  fs.unlinkSync(tmp);
  console.log(`✓ ${path.relative(root, file)}`);
}
await browser.close({silent: true});
