import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const feeds = [
  ['zbefine', 'zbefine.m3u'], ['Vamoschuck', 'vamoschuck.m3u'], ['YueChan', 'yuechan.m3u'],
  ['BigBigGrandG', 'bigbiggrandg.m3u'], ['Kimentanm', 'kimentanm.m3u'], ['YanG-1989', 'yang1989.m3u'],
  ['EPG.PW', 'epg.m3u'], ['香港频道', 'epg-hk.m3u'], ['台湾频道', 'epg-tw.m3u'],
  ['新加坡频道', 'epg-sg.m3u'], ['马来西亚频道', 'epg-my.m3u']
];
const seen = new Set();
const output = ['#EXTM3U'];
for (const [label, file] of feeds) {
  let text = '';
  try { text = await readFile(resolve(root, 'source-cache', file), 'utf8'); } catch { continue; }
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('#EXTINF:')) continue;
    const url = (lines[i + 1] || '').trim();
    if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    let info = lines[i];
    if (/group-title="[^"]*"/i.test(info)) info = info.replace(/group-title="([^"]*)"/i, (_, g) => `group-title="东云/${label} · ${g}"`);
    else info = info.replace(/^#EXTINF:/, `#EXTINF:-1 group-title="东云/${label}",`);
    output.push(info, url);
  }
}
await writeFile(resolve(root, 'playlists', 'dongyubin_github.m3u'), `${output.join('\n')}\n`, 'utf8');
console.log(`merged ${seen.size} channels`);
