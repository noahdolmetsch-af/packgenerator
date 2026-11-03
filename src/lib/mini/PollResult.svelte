<script>
  /**
   * Mini-Tools «Mini-Umfrage» (idea 2): the result of one survey, counted on this device without AI
   * («3a»): a short summary in sentences on top, then per question bars, the average or the text answers.
   * q: the survey as kept in db.settings «mini-tools» (lib/mini/store.js). waLink: «Send the result to the group».
   */
  import { t, locale } from '../i18n.svelte.js';
  import { countPoll, summarize } from './poll.js';
  import { MessageCircle } from '@lucide/svelte';

  let { q, waLink = '' } = $props();
  const fmt = (n) => Number(n).toLocaleString(locale(), { maximumFractionDigits: 1 });
  const counted = $derived(countPoll(q, q.answers ?? []));
  const lines = $derived(summarize(counted, t, fmt));
  const people = $derived(q.answers?.length ?? 0);
  const answersText = (n) => (n === 1 ? t('1 answer') : t('{n} answers', { n }));
  const pct = (n, of) => `${of ? Math.round((n / of) * 100) : 0}%`;
  const SCALE = [1, 2, 3, 4, 5];
</script>

<section class="card pr-box" aria-labelledby="pr-sum-h" data-pr-summary>
  <h2 id="pr-sum-h">{t('Summary')}</h2>
  <p class="pr-help" data-pr-people>{answersText(people)}{q.anon ? ` · ${t('anonymous')}` : ''}</p>
  {#if lines.length}
    <ul class="pr-lines">
      {#each lines as l, i (i)}<li>{l}</li>{/each}
    </ul>
    {#if waLink}<div><a class="btn" href={waLink} target="_blank" rel="noopener" data-pr-wa><MessageCircle size={16} aria-hidden="true" />{t('Send the result to the group')}</a></div>{/if}
  {:else}
    <p class="pr-help">{t('No answers yet. Share the link, then look for new answers.')}</p>
  {/if}
  <p class="pr-help">{t('Counted on this device, without AI.')}</p>
</section>

{#each counted as c, i (c.id)}
  <section class="card pr-box" aria-labelledby={`pr-q-${c.id}`} data-pr-q={c.id}>
    <h3 id={`pr-q-${c.id}`}>{i + 1}. {c.text}</h3>
    <p class="pr-help">{answersText(c.n)}</p>
    {#if c.type === 'one' || c.type === 'many' || c.type === 'yesno'}
      {@const labels = c.type === 'yesno' ? [t('No'), t('Yes')] : c.opts}
      {@const order = c.type === 'yesno' ? [1, 0] : labels.map((_, k) => k)}
      {@const max = Math.max(0, ...c.counts)}
      <ul class="pr-bars">
        {#each order as k (k)}
          <li class:top={c.n > 0 && c.counts[k] === max}>
            <span class="pr-bl">{labels[k]}</span>
            <span class="pr-bar" aria-hidden="true"><b style={`width:${pct(c.counts[k], c.n)}`}></b></span>
            <span class="pr-bn">{c.counts[k]}</span>
          </li>
        {/each}
      </ul>
      {#if c.type === 'many'}<p class="pr-help">{t('Several answers possible, so the numbers add up to more.')}</p>{/if}
    {:else if c.type === 'scale'}
      <p class="pr-avg" data-pr-avg>{c.avg === null ? '–' : t('Average {avg} of 5', { avg: fmt(c.avg) })}</p>
      <ul class="pr-bars">
        {#each SCALE as s (s)}
          <li><span class="pr-bl">{s}</span><span class="pr-bar" aria-hidden="true"><b style={`width:${pct(c.counts[s - 1], c.n)}`}></b></span><span class="pr-bn">{c.counts[s - 1]}</span></li>
        {/each}
      </ul>
    {:else}
      {#if c.words.length}<p class="pr-help">{t('Said most often: {list}', { list: c.words.map((w) => `«${w.word}» (${w.n})`).join(', ') })}</p>{/if}
      <ul class="pr-texts" data-pr-texts>
        {#each c.texts as x, j (j)}<li><span>{x.text}</span>{#if x.name}<small>{x.name}</small>{/if}</li>{/each}
      </ul>
    {/if}
  </section>
{/each}

<style>
  .pr-box {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
  }
  .pr-box h2,
  .pr-box h3 {
    margin: 0;
    font-size: var(--fs-sub);
    text-wrap: balance;
  }
  .pr-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pr-lines {
    margin: 0;
    padding-left: 1.2em;
    display: grid;
    gap: 4px;
  }
  .pr-bars {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .pr-bars li {
    display: grid;
    grid-template-columns: minmax(0, 9rem) 1fr 2.5rem;
    gap: var(--sp-2);
    align-items: center;
  }
  .pr-bl {
    overflow-wrap: break-word;
    min-width: 0;
  }
  .pr-bars li.top .pr-bl {
    font-weight: 700;
  }
  .pr-bar {
    height: 14px;
    border-radius: 7px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .pr-bar b {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .pr-bn {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .pr-avg {
    margin: 0;
    font-size: var(--fs-sub);
    font-weight: 700;
  }
  .pr-texts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .pr-texts li {
    display: grid;
    padding: var(--sp-2);
    border-radius: 8px;
    background: var(--paper-2);
  }
  .pr-texts small {
    color: var(--ink-3);
  }
</style>
