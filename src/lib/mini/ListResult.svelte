<script>
  /**
   * Mini-Tools «Anmeldeliste» (idea 4): who is in and who waits, in the order they signed up first.
   * The maker can take someone off the list (with Undo; the next on the waiting list moves up).
   * q: the list as kept in db.settings «mini-tools» (lib/mini/store.js). open: still taking sign-ups.
   */
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { dropAnswer } from './client.js';
  import { updateOne } from './store.js';
  import { seats, listText } from './liste.js';
  import { MessageCircle, UserMinus, Users, Clock } from '@lucide/svelte';

  let { q, open = false } = $props();
  const s = $derived(seats(q.answers ?? [], q.places));
  const free = $derived(Math.max(0, q.places - s.yes.length));
  const when = $derived(q.day ? `${new Date(`${q.day}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}${q.time ? `, ${q.time}` : ''}` : '');
  const wa = $derived(`https://wa.me/?text=${encodeURIComponent(listText(q, s, t, when))}`);
  const sinceFmt = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');

  async function drop(r) {
    const name = r.name || t('Without a name');
    const a = await askDelete({ title: t('Take «{name}» off the list?', { name }), text: t('The next on the waiting list moves up. You can undo it right after.'), label: t('Take off') });
    if (a !== 'delete') return;
    await deleteWithUndo({
      name,
      text: t('«{name}» is off the list.', { name }),
      run: async () => {
        if (open) await dropAnswer(q.srv, r.a);
        await updateOne(db, q.id, (x) => ({ ...x, answers: (x.answers ?? []).filter((y) => y.a !== r.a) }));
        return r;
      },
      undo: async (old) => {
        if (open) await dropAnswer(q.srv, old.a, { back: true });
        await updateOne(db, q.id, (x) => ({ ...x, answers: [...(x.answers ?? []).filter((y) => y.a !== old.a), old] }));
      },
    });
  }
</script>

<section class="card lr-box" aria-labelledby="lr-h" data-lr>
  <h2 id="lr-h">{t('{n} of {max} places taken', { n: s.yes.length, max: q.places })}</h2>
  <p class="lr-help" data-lr-sum>
    {free ? t('{n} still free', { n: free }) : t('Full|places')}{s.wait.length ? ` · ${t('{n} on the waiting list', { n: s.wait.length })}` : ''}{when ? ` · ${when}` : ''}{q.where ? ` · ${q.where}` : ''}
  </p>
  <div class="lr-bar" aria-hidden="true"><b style={`width:${(Math.min(s.yes.length, q.places) / q.places) * 100}%`}></b></div>
  {#if s.yes.length}
    <div><a class="btn" href={wa} target="_blank" rel="noopener" data-lr-wa><MessageCircle size={16} aria-hidden="true" />{t('Send the list to the group')}</a></div>
  {/if}
</section>

<section class="card lr-box" aria-labelledby="lr-in-h">
  <h2 id="lr-in-h"><Users size={18} aria-hidden="true" /> {t('Signed up')}</h2>
  {#if !s.yes.length}
    <p class="lr-help" data-lr-empty>{t('Nobody yet. Share the link, then look for new answers.')}</p>
  {:else}
    <ol class="lr-list" data-lr-in>
      {#each s.yes as r, i (r.a)}
        <li data-lr-row={r.a}>
          <span class="lr-n">{i + 1}</span>
          <span class="lr-m"><b>{r.name || t('Without a name')}</b>{#if r.note}<small>{r.note}</small>{/if}<small class="lr-at">{t('since {time}', { time: sinceFmt(r.t0) })}</small></span>
          <button type="button" class="lr-x" aria-label={t('Take «{name}» off the list?', { name: r.name || t('Without a name') })} onclick={() => drop(r)} data-lr-drop><UserMinus size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ol>
  {/if}
</section>

{#if s.wait.length}
  <section class="card lr-box" aria-labelledby="lr-wait-h">
    <h2 id="lr-wait-h"><Clock size={18} aria-hidden="true" /> {t('Waiting list')}</h2>
    <p class="lr-help">{t('When someone signs off or you take someone off, the first one here moves up by itself.')}</p>
    <ol class="lr-list" data-lr-wait>
      {#each s.wait as r, i (r.a)}
        <li data-lr-row={r.a}>
          <span class="lr-n">{i + 1}</span>
          <span class="lr-m"><b>{r.name || t('Without a name')}</b>{#if r.note}<small>{r.note}</small>{/if}</span>
          <button type="button" class="lr-x" aria-label={t('Take «{name}» off the list?', { name: r.name || t('Without a name') })} onclick={() => drop(r)} data-lr-drop><UserMinus size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ol>
  </section>
{/if}

<style>
  .lr-box {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
  }
  .lr-box h2 {
    margin: 0;
    font-size: var(--fs-sub);
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .lr-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lr-bar {
    height: 12px;
    border-radius: 6px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .lr-bar b {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .lr-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .lr-list li {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
  }
  .lr-list li:last-child {
    border-bottom: 0;
  }
  .lr-n {
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--paper-2);
    font-weight: 700;
    font-size: var(--fs-small);
  }
  .lr-m {
    flex: 1;
    min-width: 0;
    display: grid;
  }
  .lr-m small {
    color: var(--ink-3);
  }
  .lr-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
