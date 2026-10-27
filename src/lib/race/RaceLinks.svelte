<script>
  /**
   * «Links pro Rennen» (Noah 27.10.2026, idea 1 after the Rennen-Check): the race's own links (handbook,
   * rules, tracker, website, anything else) on the page «Rennen detailliert planen». Rows { id, text, url }
   * in stored.links; add, change, delete with Undo, sort with arrows and dragging (EditList). A race without
   * links yet shows the old «Link to the rules» (stored.rulesUrl) as its first row.
   */
  import { ExternalLink, Plus } from '@lucide/svelte';
  import EditList from './EditList.svelte';
  import { linksOf, LINK_KINDS, withKind, safeUrl } from './links-lib.js';
  import { t } from '../i18n.svelte.js';

  let { ctx } = $props();
  const rows = $derived(linksOf(ctx.stored, t));
  const save = (list) => ctx.save({ links: list.map((r) => ({ id: r.id, text: r.text, url: safeUrl(r.url) ?? String(r.url ?? '').trim() })) });
  const open = $derived(rows.filter((r) => safeUrl(r.url)));
  const missing = $derived(LINK_KINDS.filter((k) => !rows.some((r) => r.text.trim().toLowerCase() === t(k.name).toLowerCase())));
</script>

<section class="rc-box" aria-labelledby="rl-h" data-race-links>
  <h2 id="rl-h" class="rc-h2">{t('Links to the race')}</h2>
  <p class="rc-note">{t('Handbook, rules, tracker, website: everything about this race one tap away. Tap a row to put in or change its address.')}</p>
  {#if open.length}
    <div class="rl-open">
      {#each open as r (r.id)}
        <a class="btn sm" href={safeUrl(r.url)} target="_blank" rel="noopener noreferrer" aria-label={t('Open the link «{name}»', { name: r.text })} data-race-link-open={r.id}><ExternalLink size={14} aria-hidden="true" />{r.text}</a>
      {/each}
    </div>
  {/if}
  <EditList {rows} onchange={save} label={t('Name')} addLabel={t('Add')} placeholder={t('Name or address, e.g. Handbook')} name={t('Link')} testid="links">
    {#snippet sub(r)}
      {#if safeUrl(r.url)}<small class="rl-host">{new URL(safeUrl(r.url)).host.replace(/^www\./, '')}</small>{:else}<small class="rc-warn">{t('No address yet: tap to add it')}</small>{/if}
    {/snippet}
    {#snippet fields(edit)}
      <label class="rc-lab">{t('Address')}<input class="inp" type="url" inputmode="url" placeholder="https://" bind:value={edit.url} data-race-link-url /></label>
    {/snippet}
  </EditList>
  {#if missing.length}
    <div class="rc-acts">
      {#each missing as k (k.key)}
        <button type="button" class="btn sm" onclick={() => save(withKind(rows, k, t))} data-race-link-kind={k.key}><Plus size={14} aria-hidden="true" />{t(k.name)}</button>
      {/each}
    </div>
  {/if}
</section>

<style>
  .rl-open {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .rl-open a {
    max-width: 100%;
    overflow-wrap: break-word;
  }
  .rl-host {
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
</style>
