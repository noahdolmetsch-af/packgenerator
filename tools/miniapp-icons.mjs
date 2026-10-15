// Kleine Apps (14.10.2026): draws the home-screen icons of the small apps into public/apps/<key>/.
// Usage: node tools/miniapp-icons.mjs public/apps
import { chromium } from 'playwright';
import fs from 'node:fs';
const icons = {
  meditation: { word: 'MEDI', paths: ['M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20', 'M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13'] },
  packliste: { word: 'PACK', paths: ['M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M8 10h8', 'M8 18h8', 'M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6', 'M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2'] },
  velopflege: { word: 'VELO', paths: ['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z'] },
};
const svg = (ic) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0F2E27"/>
<g transform="translate(136 76) scale(10)" fill="none" stroke="#FF5B14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ic.paths.map((d) => `<path d="${d}"/>`).join('')}</g>
<text x="256" y="452" text-anchor="middle" font-family="DejaVu Sans Condensed, sans-serif" font-weight="bold" font-size="72" fill="#F5F6F1">${ic.word}</text></svg>`;
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage();
for (const [k, ic] of Object.entries(icons)) {
  for (const s of [192, 512]) {
    await p.setViewportSize({ width: s, height: s });
    await p.setContent(`<html><body style="margin:0">${svg(ic).replace('<svg ', `<svg width="${s}" height="${s}" `)}</body></html>`);
    await p.screenshot({ path: `${out}/${k}/icon-${s}.png` });
  }
}
await b.close();
