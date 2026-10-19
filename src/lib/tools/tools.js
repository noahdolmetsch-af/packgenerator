/**
 * Paket L «Werkzeugkasten» (Noah 19.10.2026, wishes #3, #149 and the small helpers): the tools of
 * Ich › Werkzeugkasten (#/me/tools), each on its own sub-page #/me/tools/<key>. Everything works on
 * the device; nothing is sent to a web page. Titles and lines are English keys for t().
 * Pure, tested in tests/werkzeugkasten.test.js.
 */
export const TOOLS_HASH = '#/me/tools';

export const TOOLS = [
  { key: 'calc', icon: 'calculator', title: 'Calculator', sub: 'Plus, minus, times, divided, percent' },
  { key: 'units', icon: 'ruler', title: 'Convert units', sub: 'km, kg, °C, tyre pressure; works offline' },
  { key: 'money', icon: 'coins', title: 'Currencies', sub: 'What it costs in Franken; rates once a day' },
  { key: 'costs', icon: 'wallet', title: 'Trip costs', sub: 'Who paid what, who owes whom' },
  { key: 'zones', icon: 'clock', title: 'Time zones', sub: 'The time in other places' },
  { key: 'compass', icon: 'compass', title: 'Compass', sub: 'North and your direction, from the phone' },
  { key: 'phrases', icon: 'languages', title: 'Phrases abroad', sub: 'Important sentences, offline' },
  { key: 'ablage', icon: 'paperclip', title: 'Links and files', sub: 'Important links and small files' },
  { key: 'pdf', icon: 'file', title: 'PDF', sub: 'Merge, make smaller, share' },
  { key: 'photo', icon: 'image', title: 'Photos', sub: 'Make smaller, cut, cut out' },
];

export const toolOf = (key) => TOOLS.find((x) => x.key === key) ?? null;

/** The tool of a hash: «#/me/tools/calc?x» → 'calc'; the list → ''. */
export function toolKeyOf(hash) {
  const m = /^#\/me\/tools\/([a-z]+)/.exec(String(hash ?? ''));
  return m && toolOf(m[1]) ? m[1] : '';
}

/** Saves or shares a file: the share sheet where the device has one for files, else a download. */
export async function deliver(blob, name, { share = true } = {}) {
  const file = new File([blob], name, { type: blob.type });
  if (share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
