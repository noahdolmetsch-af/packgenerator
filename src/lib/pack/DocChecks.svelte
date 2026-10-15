<script>
  /**
   * P3b «Daten sicher» (D3 «Für die nächste Reise», D4 «In die Packliste», Noah 12.10.2026 «5a»): the
   * papers marked for the packing list as ticks in the packing list of a trip: «ID and cash with you?»
   * for the group «IDs», «{name} with you?» for the others, each with a link to the document.
   * The ticks are kept on the trip (trip.docChecks), the same ones as on Ich › Dokumente.
   * Nothing shows while no document is marked (a suggestion, never a must).
   */
  import { db } from '../db.js';
  import { docs, DOCS_HASH } from '../docs/client.svelte.js';
  import { packRows } from '../docs.js';
  import { FileText, ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { trip } = $props();
  const rows = $derived(packRows(docs.list));
  const ticks = $derived(trip?.docChecks ?? {});

  async function tick(key, on) {
    if (trip?.id) await db.trips.update(trip.id, { docChecks: { ...(trip.docChecks ?? {}), [key]: on } });
  }
</script>

{#if rows.length && trip}
  <section class="card doc-checks" aria-labelledby="dc-h" data-doc-checks>
    <h3 id="dc-h"><FileText size={16} aria-hidden="true" />{t('Documents')}</h3>
    <ul>
      {#each rows as r (r.key)}
        <li>
          <label><input type="checkbox" checked={!!ticks[r.key]} onchange={(e) => tick(r.key, e.currentTarget.checked)} /><span>{t(r.label, { name: r.name })}</span></label>
          <a href={`${DOCS_HASH}/${encodeURIComponent(r.doc.id)}`}>{t('See')}<ChevronRight size={14} aria-hidden="true" /></a>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .doc-checks {
    padding: 12px 16px;
    margin: 12px 0;
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 4px;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 44px;
  }
  label {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }
  input {
    width: 20px;
    height: 20px;
    flex: none;
  }
  a {
    display: inline-flex;
    align-items: center;
    font-size: var(--fs-small);
    white-space: nowrap;
  }
</style>
