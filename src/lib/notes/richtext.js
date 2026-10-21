/**
 * Paket NE 1147 «Formatiert schreiben» (Noah 20.10.2026 «6a»): the note is written like in Word, without
 * Markdown marks; the app keeps the text as Markdown light (noteformats.js mdToHtml), so search, export,
 * share, backups and older notes stay as they are.
 *
 * htmlToMd reads what the editor shows (a DOM tree, or any object with nodeType, nodeName, childNodes,
 * textContent and getAttribute) back into Markdown light. Pure; no DOM needed in tests.
 */

const BLOCKS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'TABLE', 'BLOCKQUOTE', 'PRE']);
const HEAD = { H1: '#', H2: '#', H3: '#', H4: '##', H5: '###', H6: '###' };

const name = (n) => String(n?.nodeName ?? '').toUpperCase();
const kids = (n) => Array.from(n?.childNodes ?? []);
const attr = (n, a) => (typeof n?.getAttribute === 'function' ? n.getAttribute(a) : null);

/** The inline text of a node with **bold**, *italic*, ~~struck~~ and `code`; a <br> is a new line. */
function inlineMd(n) {
  if (n.nodeType === 3) return String(n.textContent ?? '').replace(/ /g, ' ');
  if (n.nodeType !== 1) return '';
  const tag = name(n);
  if (tag === 'BR') return '\n';
  const inner = kids(n).map(inlineMd).join('');
  if (!inner.trim()) return inner;
  const wrap = (m) => {
    // the marks go round the words, not round spaces at the edge («** fett**» would not be bold)
    const [, a, mid, b] = inner.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return `${a}${m}${mid}${m}${b}`;
  };
  const style = String(attr(n, 'style') ?? '');
  if (tag === 'B' || tag === 'STRONG' || /font-weight:\s*(bold|[6-9]00)/.test(style)) return wrap('**');
  if (tag === 'I' || tag === 'EM' || /font-style:\s*italic/.test(style)) return wrap('*');
  if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL' || /line-through/.test(style)) return wrap('~~');
  if (tag === 'CODE') return wrap('`');
  return inner;
}

/** Inline content of a block, without block children (they are read on their own). */
function lineOf(n) {
  return kids(n)
    .filter((c) => !(c.nodeType === 1 && BLOCKS.has(name(c))))
    .map(inlineMd)
    .join('');
}

const clean = (s) => s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');

/** The editor's content as Markdown light. */
export function htmlToMd(root) {
  const out = [];
  const pushLines = (text, prefix = '') => {
    for (const l of String(text).split('\n')) out.push(prefix + l.trimEnd());
  };
  function block(n) {
    if (n.nodeType === 3) {
      if (String(n.textContent ?? '').trim()) pushLines(inlineMd(n));
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = name(n);
    if (tag === 'BR') return void out.push('');
    if (!BLOCKS.has(tag)) return void pushLines(inlineMd(n));
    if (HEAD[tag]) return void out.push(`${HEAD[tag]} ${lineOf(n).replace(/\n/g, ' ').trim()}`);
    if (tag === 'UL' || tag === 'OL') {
      let k = 0;
      for (const li of kids(n)) {
        if (li.nodeType !== 1 || name(li) !== 'LI') {
          if (li.nodeType === 1) block(li);
          continue;
        }
        k += 1;
        const todo = attr(li, 'data-todo');
        const mark = tag === 'OL' ? `${k}. ` : todo != null ? `- [${todo === '1' ? 'x' : ' '}] ` : '- ';
        const text = lineOf(li).replace(/\n/g, ' ').trim();
        out.push(mark + text);
        for (const c of kids(li)) if (c.nodeType === 1 && (name(c) === 'UL' || name(c) === 'OL')) block(c);
      }
      return;
    }
    if (tag === 'TABLE') {
      const rows = [];
      const walk = (x) => {
        for (const c of kids(x)) {
          if (c.nodeType !== 1) continue;
          if (name(c) === 'TR') rows.push(kids(c).filter((d) => d.nodeType === 1 && /^T[HD]$/.test(name(d))).map((d) => inlineMd(d).replace(/\n/g, ' ').replace(/\|/g, '/').trim()));
          else walk(c);
        }
      };
      walk(n);
      rows.forEach((r, i) => {
        out.push(`| ${r.join(' | ')} |`);
        if (i === 0) out.push(`|${r.map(() => '---').join('|')}|`);
      });
      return;
    }
    // P, DIV, BLOCKQUOTE, PRE, LI out of a list: its own text, then its block children
    const hasBlock = kids(n).some((c) => c.nodeType === 1 && BLOCKS.has(name(c)));
    if (!hasBlock) return void pushLines(kids(n).map(inlineMd).join('').replace(/\n$/, ''));
    let run = [];
    const flush = () => {
      const s = run.map(inlineMd).join('');
      if (s.trim()) pushLines(s.replace(/\n$/, ''));
      run = [];
    };
    for (const c of kids(n)) {
      if (c.nodeType === 1 && BLOCKS.has(name(c))) (flush(), block(c));
      else run.push(c);
    }
    flush();
  }
  for (const n of kids(root)) block(n);
  return clean(out.join('\n')).replace(/^\n+|\n+$/g, '');
}

/** A small table to put in at the cursor (2 columns, a head and one row). */
export const TABLE_HTML = '<table><tr><th>A</th><th>B</th></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></table><p><br></p>';

/** Edit mode of notes on this device: 'rich' (formatted, the default) or 'marks' (text with Markdown marks). */
export const EDIT_MODE_KEY = 'notes.editMode';
export function editMode() {
  try {
    return localStorage.getItem(EDIT_MODE_KEY) === 'marks' ? 'marks' : 'rich';
  } catch {
    return 'rich';
  }
}
export function setEditMode(m) {
  try {
    localStorage.setItem(EDIT_MODE_KEY, m === 'marks' ? 'marks' : 'rich');
  } catch {
    /* only this time */
  }
}
