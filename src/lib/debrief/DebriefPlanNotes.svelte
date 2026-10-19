<script>
  /**
   * Planungs-Notizen in the debrief (IS 246–249): the notes made while planning this trip, each with
   * «Hat es geholfen?» (Ja / Nein, a second tap takes it back). A note that helped can become a learning
   * for the next trips (plannotes.js planLearning). Nothing here is a must.
   */
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { NotebookPen, Check } from '@lucide/svelte';
  import { MADE_WORD, planNotesOf, setHelped, planLearning } from '../plannotes.js';

  let { trip } = $props();
  const notes = $derived(planNotesOf(trip));

  async function write(fn, tables = []) {
    const id = trip.id;
    await db.transaction('rw', [db.trips, ...tables], async () => {
      const cur = await db.trips.get(id);
      if (cur) await db.trips.update(id, touched({ planNotes: await fn(cur) }));
    });
  }
  const helped = (n, yes) => write((cur) => setHelped(planNotesOf(cur), n.id, yes));
  const learn = (n) =>
    write(
      async (cur) => {
        const rec = planLearning(n, cur, await db.learnings.toArray());
        await db.learnings.put(rec);
        return planNotesOf(cur).map((x) => (x.id === n.id ? { ...x, learned: rec.id } : x));
      },
      [db.learnings],
    );
</script>

{#if notes.length}
  <section class="rv-sec plannotes" aria-labelledby="plannotes-h" data-debrief-plan-notes>
    <div class="rv-h"><div><h2 id="plannotes-h">{t('Planning notes')}</h2><p class="rv-sub">{t('Did it help?')}</p></div></div>
    <ul class="rv-box">
      {#each notes as n (n.id)}
        <li class="rv-row dpn" data-plan-note={n.id}>
          <span class="rv-ic" aria-hidden="true"><NotebookPen size={18} /></span>
          <span class="rv-m"><span class="rv-t">{n.text}</span>{#if n.made}<span class="rv-s">{t(MADE_WORD[n.made.kind])}</span>{/if}</span>
          <span class="dpn-acts" role="group" aria-label={t('Did «{text}» help?', { text: n.text })}>
            <button type="button" class="btn sm" aria-pressed={n.helped === true} onclick={() => helped(n, true)}>{t('Yes|helped')}</button>
            <button type="button" class="btn sm" aria-pressed={n.helped === false} onclick={() => helped(n, false)}>{t('No|helped')}</button>
          </span>
          {#if n.helped === true}
            <span class="dpn-learn">
              {#if n.learned}<span class="dpn-ok" role="status"><Check size={16} aria-hidden="true" />{t('Kept as a learning')}</span>
              {:else}<button type="button" class="btn sm" onclick={() => learn(n)}>{t('Keep as a learning')}</button>{/if}
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .dpn {
    flex-wrap: wrap;
  }
  .dpn-acts {
    display: flex;
    flex: none;
    gap: 6px;
  }
  .dpn-acts :global(.btn),
  .dpn-learn :global(.btn) {
    min-height: 44px;
  }
  .dpn-acts :global(.btn[aria-pressed='true']) {
    border-color: var(--hi);
    background: var(--hi-soft);
    font-weight: 600;
  }
  .dpn-learn {
    flex-basis: 100%;
    padding-left: 44px;
  }
  .dpn-ok {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
