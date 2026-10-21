<script>
  /**
   * Paket NE 1147 (Noah 20.10.2026 «6a»): write a note formatted, like in Word: bold, italic, struck,
   * a heading, lists, ticks and a small table, with buttons and without marks. The note keeps the text as
   * Markdown light (htmlToMd), so nothing else changes. Pasted text comes in as plain text.
   * value: bindable Markdown light. labelledby: the id of the field's label.
   */
  import { t } from '../i18n.svelte.js';
  import { mdToHtml } from '../noteformats.js';
  import { htmlToMd, TABLE_HTML } from './richtext.js';
  import { Bold, Italic, Strikethrough, Heading, List, ListOrdered, ListChecks, Table, RemoveFormatting } from '@lucide/svelte';

  let { value = $bindable(''), labelledby = '', placeholder = '' } = $props();

  let el = $state(null);
  let last = null; // the Markdown the editor gave last (so typing does not rebuild the editor)

  $effect(() => {
    const v = value ?? '';
    if (!el || v === last) return;
    el.innerHTML = mdToHtml(v);
    last = v;
  });

  function read() {
    last = htmlToMd(el);
    value = last;
  }
  function cmd(name, arg = null) {
    el.focus();
    try {
      document.execCommand(name, false, arg);
    } catch {
      /* an old browser: nothing happens */
    }
    read();
  }
  function heading() {
    const block = String(document.queryCommandValue?.('formatBlock') ?? '').toLowerCase();
    cmd('formatBlock', /^h\d$/.test(block) ? 'p' : 'h4');
  }
  /** The list item at the cursor, or null. */
  function itemAtCursor() {
    let n = getSelection()?.anchorNode ?? null;
    while (n && n !== el) {
      if (n.nodeName === 'LI') return n;
      n = n.parentNode;
    }
    return null;
  }
  function ticks() {
    el.focus();
    let li = itemAtCursor();
    if (!li) {
      cmd('insertUnorderedList');
      li = itemAtCursor();
    }
    if (!li) return;
    const list = li.parentNode;
    const on = li.hasAttribute('data-todo');
    for (const x of list.children) if (x.nodeName === 'LI') on ? x.removeAttribute('data-todo') : x.hasAttribute('data-todo') || x.setAttribute('data-todo', '0');
    read();
  }
  function table() {
    cmd('insertHTML', TABLE_HTML);
  }
  // a tap on the box of a tick ticks it
  function click(e) {
    const li = e.target.closest?.('li[data-todo]');
    if (!li || !el.contains(li)) return;
    const r = li.getBoundingClientRect();
    if (e.clientX - r.left > 30) return;
    e.preventDefault();
    li.setAttribute('data-todo', li.getAttribute('data-todo') === '1' ? '0' : '1');
    read();
  }
  function paste(e) {
    const text = e.clipboardData?.getData('text/plain');
    if (text == null) return;
    e.preventDefault();
    document.execCommand('insertText', false, text);
    read();
  }
  function keydown(e) {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'b') (e.preventDefault(), cmd('bold'));
    else if (mod && e.key.toLowerCase() === 'i') (e.preventDefault(), cmd('italic'));
  }
  const BTN = [
    { key: 'bold', name: 'Bold', icon: Bold, run: () => cmd('bold') },
    { key: 'italic', name: 'Italic', icon: Italic, run: () => cmd('italic') },
    { key: 'strike', name: 'Struck through', icon: Strikethrough, run: () => cmd('strikeThrough') },
    { key: 'heading', name: 'Heading', icon: Heading, run: heading },
    { key: 'ul', name: 'List', icon: List, run: () => cmd('insertUnorderedList') },
    { key: 'ol', name: 'Numbered list', icon: ListOrdered, run: () => cmd('insertOrderedList') },
    { key: 'todo', name: 'Tick list', icon: ListChecks, run: ticks },
    { key: 'table', name: 'Table', icon: Table, run: table },
    { key: 'plain', name: 'Remove formatting', icon: RemoveFormatting, run: () => cmd('removeFormat') },
  ];
</script>

<div class="rt">
  <div class="rtb" role="toolbar" aria-label={t('Format')} data-rt-bar>
    {#each BTN as b (b.key)}{@const I = b.icon}<button type="button" class="tb" aria-label={t(b.name)} title={t(b.name)} onmousedown={(e) => e.preventDefault()} onclick={b.run} data-rt={b.key}><I size={16} aria-hidden="true" /></button>{/each}
  </div>
  <div
    class="ed md"
    bind:this={el}
    contenteditable="true"
    role="textbox"
    aria-multiline="true"
    tabindex="0"
    aria-labelledby={labelledby || undefined}
    data-placeholder={placeholder}
    oninput={read}
    onblur={read}
    onclick={click}
    onpaste={paste}
    onkeydown={keydown}
    data-rt-edit
  ></div>
</div>

<style>
  .rt {
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
  }
  .rt:focus-within {
    border-color: var(--accent);
  }
  .rtb {
    display: flex;
    gap: 0;
    overflow-x: auto;
    border-bottom: 1px solid var(--line);
    scrollbar-width: thin;
  }
  .tb {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .tb:hover {
    background: var(--paper-2);
  }
  .ed {
    min-height: 7em;
    padding: 8px 10px;
    outline: none;
    overflow-wrap: break-word;
    overflow-x: auto;
  }
  .ed:empty::before {
    content: attr(data-placeholder);
    color: var(--ink-3);
  }
  .ed :global(h3),
  .ed :global(h4),
  .ed :global(h5) {
    margin: 6px 0 4px;
    font-size: var(--fs-sub);
  }
  .ed :global(p) {
    margin: 4px 0;
  }
  .ed :global(ul),
  .ed :global(ol) {
    margin: 4px 0;
    padding-left: 1.4em;
  }
  .ed :global(li[data-todo]) {
    list-style: none;
    position: relative;
    margin-left: -0.4em;
    padding-left: 28px;
  }
  .ed :global(li[data-todo])::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.15em;
    width: 18px;
    height: 18px;
    border: 2px solid var(--ink-3);
    border-radius: 4px;
    box-sizing: border-box;
    cursor: pointer;
  }
  .ed :global(li[data-todo='1']) {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .ed :global(li[data-todo='1'])::before {
    border-color: var(--accent);
    background: var(--accent);
    box-shadow: inset 0 0 0 3px var(--paper);
  }
  .ed :global(table) {
    border-collapse: collapse;
    margin: 4px 0;
  }
  .ed :global(th),
  .ed :global(td) {
    min-width: 3em;
    padding: 4px 8px;
    border: 1px solid var(--line);
    text-align: left;
  }
</style>
