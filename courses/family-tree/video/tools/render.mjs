// Renders the full film and (optionally) one MP4 per act, then normalises
// loudness to −16 LUFS (EBU R128) for classroom speakers.
//   node tools/render.mjs            → out/从我出发找家人.mp4
//   node tools/render.mjs --acts     → also out/acts/<id>-<name>.mp4
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tl = JSON.parse(fs.readFileSync(path.join(root, 'src/timeline.json'), 'utf8'));
const out = path.join(root, 'out');
fs.mkdirSync(path.join(out, 'acts'), {recursive: true});

const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.REMOTION_BROWSER ?? null});

const loudnorm = (src, dst) => {
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-c:v', 'copy',
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-movflags', '+faststart', dst], {stdio: 'inherit'});
  fs.unlinkSync(src);
};

const render = async (id, file) => {
  const composition = await selectComposition({serveUrl, id, puppeteerInstance: browser});
  const tmp = file.replace(/\.mp4$/, '.raw.mp4');
  let lastPct = -10;
  const t0 = Date.now();
  await renderMedia({
    composition, serveUrl, codec: 'h264', outputLocation: tmp, puppeteerInstance: browser,
    concurrency: Math.max(1, os.cpus().length), crf: 18, pixelFormat: 'yuv420p',
    imageFormat: 'jpeg', jpegQuality: 92,
    onProgress: ({progress}) => {
      const pct = Math.floor(progress * 100);
      if (pct >= lastPct + 10) { lastPct = pct; console.log(`${id}: ${pct}% (${((Date.now() - t0) / 1000).toFixed(0)}s)`); }
    },
  });
  loudnorm(tmp, file);
  console.log(`✓ ${path.relative(root, file)}`);
};

await render('Full', path.join(out, '从我出发找家人.mp4'));
if (process.argv.includes('--acts')) {
  for (const a of tl.acts) await render(a.id, path.join(out, 'acts', `${a.id}-${a.name.replace(/[：:]/g, '-')}.mp4`));
}
await browser.close({silent: true});
