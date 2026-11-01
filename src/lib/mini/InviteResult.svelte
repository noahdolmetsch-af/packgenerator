<script>
  /**
   * Mini-Tools «Spontan-Einladung» (idea 5): who is in, who maybe, who not this time.
   * q: the invite as kept in db.settings «mini-tools» (lib/mini/store.js).
   */
  import { t, locale } from '../i18n.svelte.js';
  import InviteFacts from './InviteFacts.svelte';
  import { groupReplies, inviteText, REPLIES } from './einladung.js';
  import { MessageCircle } from '@lucide/svelte';

  let { q } = $props();
  const g = $derived(groupReplies(q.answers ?? []));
  const when = $derived(new Date(`${q.day}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' }));
  const wa = $derived(`https://wa.me/?text=${encodeURIComponent(inviteText(q, g, t, when))}`);
  const HEAD = { y: 'In|coming', m: 'Maybe', n: 'Not this time' };
</script>

<section class="card ir-box" aria-labelledby="ir-h" data-ir>
  <h2 id="ir-h">{t('{n} in', { n: g.y.length })}{g.m.length ? ` · ${t('{n} maybe', { n: g.m.length })}` : ''}{g.n.length ? ` · ${t('{n} not', { n: g.n.length })}` : ''}</h2>
  <InviteFacts {q} />
  {#if g.y.length || g.m.length}<div><a class="btn" href={wa} target="_blank" rel="noopener" data-ir-wa><MessageCircle size={16} aria-hidden="true" />{t('Send who comes to the group')}</a></div>{/if}
</section>

<section class="card ir-box" aria-labelledby="ir-who-h">
  <h2 id="ir-who-h">{t('Answers')}</h2>
  {#if !(q.answers ?? []).length}
    <p class="ir-help" data-ir-empty>{t('No answers yet. Share the link, then look for new answers.')}</p>
  {:else}
    <div class="ir-cols">
      {#each REPLIES as r (r.key)}
        <div class={`ir-col c-${r.key}`} data-ir-col={r.key}>
          <h3>{t(HEAD[r.key])} <span>{g[r.key].length}</span></h3>
          {#if g[r.key].length}
            <ul>
              {#each g[r.key] as x (x.a)}<li><b>{x.name || t('Without a name')}</b>{#if x.note}<small>{x.note}</small>{/if}</li>{/each}
            </ul>
          {:else}
            <p class="ir-help">–</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .ir-box {
    display: grid;
    gap: var(--sp-3);
    min-width: 0;
  }
  .ir-box h2 {
    margin: 0;
    font-size: var(--fs-sub);
    text-wrap: balance;
  }
  .ir-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ir-cols {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--sp-3);
  }
  .ir-col {
    border-radius: 10px;
    padding: var(--sp-3);
    background: var(--paper-2);
    display: grid;
    gap: var(--sp-2);
    align-content: start;
  }
  .ir-col.c-y {
    background: var(--ok-soft);
  }
  .ir-col.c-m {
    background: var(--warn-soft);
  }
  .ir-col h3 {
    margin: 0;
    font-size: var(--fs-body);
    display: flex;
    justify-content: space-between;
  }
  .ir-col ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .ir-col li {
    display: grid;
  }
  .ir-col small {
    color: var(--ink-3);
  }
</style>
