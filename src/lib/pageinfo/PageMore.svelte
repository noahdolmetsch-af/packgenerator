<script>
  /**
   * «Inhalte Flow» IF1 + IF2 (Noah 14.10.2026 «1b», mockups approved 04:32): at the end of a page the fold
   * «What the app can do here» (closed; IF2 shows it open), each row opens the place. The tiles «Next» (3a)
   * are the page tiles of SK (PageTiles), which the page shows right after this.
   * When the tip line is not on the page (tips off, hidden today), a quiet «Tips for this page ›» here
   * still opens the tips. page: a key of PAGES; name: the page's name; base: for the hrefs.
   * «Mehr Inhalt» 3a (Noah 15.10.2026): a page's examples to take over, each a closed fold; «Save as
   * note» keeps it as an own note with a checklist (Ich › Notizen), nothing else changes.
   */
  import { Lightbulb, ChevronDown, NotebookPen, Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { newKeptNote } from '../notebook.js';
  import TipsSheet from './TipsSheet.svelte';
  import { pageInfo } from './store.svelte.js';
  import { PAGES, canRows, canShown, setCan, tipOfDay, examplesOf, exampleNote } from '../pageinfo.js';
  import { localDay } from '../localday.js';
  import { t, tn } from '../i18n.svelte.js';

  let { page, name, base = '', open = false } = $props();
  const pi = pageInfo();
  const today = localDay();
  const rows = $derived(canRows(page, base));
  const noTip = $derived(pi.loaded && !tipOfDay(pi.info, page, today) && PAGES[page]?.tips?.length);

  let tipsOpen = $state(false);
  const examples = $derived(examplesOf(page));
  let saved = $state({});
  async function keep(ex) {
    await db.notes.put(newKeptNote(exampleNote(ex, t), { id: `note-${Date.now().toString(36)}` }));
    saved = { ...saved, [ex.id]: true };
  }
</script>

{#if pi.loaded && rows.length && canShown(pi.info, page)}
  <details class="card can" data-section="can" {open}>
    <summary>
      <Lightbulb size={18} aria-hidden="true" />
      <span><b>{t('What the app can do here')}</b> · {tn(rows.length, '{n} thing|can', '{n} things|can')}</span>
      <ChevronDown class="chev" size={18} aria-hidden="true" />
    </summary>
    <ul>
      {#each rows as r (r.id)}
        <li><a href={r.href} data-can={r.id}><b>{t(r.title)}</b><small>{t(r.sub)}</small></a></li>
      {/each}
    </ul>
    <button type="button" class="lk" onclick={() => pi.save((v) => setCan(v, page, false))}>{t('Hide this line')}</button>
  </details>
{/if}

{#if pi.loaded && pi.info.tipsOn}
  {#each examples as ex (ex.id)}
    <details class="card can ex" data-example={ex.id}>
      <summary>
        <NotebookPen size={18} aria-hidden="true" />
        <span><small>{t('Example to take over')}</small><b>{t(ex.title)}</b></span>
        <ChevronDown class="chev" size={18} aria-hidden="true" />
      </summary>
      <ul class="exl">
        {#each ex.lines as line (line)}<li>{t(line)}</li>{/each}
      </ul>
      {#if saved[ex.id]}
        <p class="done" role="status"><Check size={16} aria-hidden="true" />{t('Saved as a note.')} <a href="#/notes">{t('Open the notes ›')}</a></p>
      {:else}
        <button type="button" class="btn sm keep" onclick={() => keep(ex)}><NotebookPen size={16} aria-hidden="true" />{t('Save as note')}</button>
      {/if}
    </details>
  {/each}
{/if}

{#if noTip}<button type="button" class="lk tipsl" onclick={() => (tipsOpen = true)}>{t('Tips for this page ›')}</button>{/if}

{#if tipsOpen}<TipsSheet {page} {name} onclose={() => (tipsOpen = false)} />{/if}

<style>
  .can {
    padding: 0;
  }
  summary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 10px 16px;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary span {
    flex: 1;
    min-width: 0;
  }
  summary :global(.chev) {
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  details[open] summary :global(.chev) {
    transform: rotate(180deg);
  }
  .can ul {
    list-style: none;
    margin: 0;
    padding: 0 16px;
  }
  .can li a {
    display: grid;
    gap: 2px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
  }
  .can li small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .lk {
    min-height: 44px;
    border: 0;
    padding: 8px 16px 12px;
    background: none;
    color: var(--ink-3);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
  }
  .ex summary span {
    display: grid;
  }
  .ex summary small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .exl {
    margin: 0;
    padding: 0 16px 4px 36px;
  }
  .exl li {
    padding: 4px 0;
  }
  .keep {
    margin: 8px 16px 14px;
  }
  .done {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin: 8px 16px 14px;
    color: var(--ink-2);
  }
  .tipsl {
    justify-self: start;
    padding: 4px 0;
  }
  /* Paket A: «Save as note» is a tap target of 44 px on a computer too (small buttons are 32 px there) */
  .keep {
    min-height: 44px;
  }
</style>
