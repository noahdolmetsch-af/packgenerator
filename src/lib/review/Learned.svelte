<script>
  /**
   * v0.53.0 R2 «Gelernt» (Noah ★a): every learning in one flat list by topic, nothing folded: the
   * topic with the most learnings first, the important ones first in a topic. A search on top.
   * (R1 left this page as it was: topics folded shut.)
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { learnedOn } from '../yearreview.js';
  import { dayLong } from './fmt.js';
  import { t, num } from '../i18n.svelte.js';

  const learnQ = liveQuery(() => db.learnings.toArray());
  const learnings = $derived($learnQ ?? []);
  let lq = $state('');
  // v0.30.2 (test R6.12): topics typed in small letters ("gear") are shown like the others.
  const topicName = (topic) => {
    const s = String(topic ?? '');
    return t(s) !== s ? t(s) : t(s.charAt(0).toUpperCase() + s.slice(1));
  };
  const topics = $derived.by(() => {
    const q = lq.trim().toLowerCase();
    const list = learnings.filter((l) => !q || `${l.topic} ${topicName(l.topic)} ${l.rule} ${l.action ?? ''} ${l.source ?? ''}`.toLowerCase().includes(q));
    const map = new Map();
    for (const l of list) map.set(l.topic, [...(map.get(l.topic) ?? []), l]);
    const rank = { high: 0, medium: 1, low: 2 };
    return [...map].map(([topic, ls]) => ({ topic, ls: ls.sort((a, b) => (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3)) })).sort((a, b) => b.ls.length - a.ls.length || topicName(a.topic).localeCompare(topicName(b.topic)));
  });
  const meta = (l) => [l.source === 'import' ? t('From the import') : l.source, learnedOn(l) ? dayLong(learnedOn(l)) : '', l.confirmed ? t('confirmed {n}×', { n: l.confirmed }) : ''].filter(Boolean).join(' · ');
</script>

<section id="learnings" class="learned" aria-labelledby="learn-h">
  <h2 id="learn-h" class="sr">{t('Learnings')}</h2>
  <input class="inp q" type="search" placeholder={t('Search learnings')} bind:value={lq} aria-label={t('Search learnings')} />
  <p class="count num">{t('{n} learnings in {k} topics', { n: num(learnings.length), k: num(topics.length) })}</p>
  {#each topics as g (g.topic)}
    <section class="topic" aria-label={topicName(g.topic)}>
      <h3><span class="tname">{topicName(g.topic)}</span> <span class="n num">{g.ls.length}</span></h3>
      <ul>
        {#each g.ls as l (l.id)}
          <li>
            <span class="rule">{l.rule}{#if l.priority === 'high'} <span class="pill act">{t('high')}</span>{/if}</span>
            {#if l.action}<small class="do">→ {l.action}</small>{/if}
            {#if meta(l)}<small class="muted">{meta(l)}</small>{/if}
          </li>
        {/each}
      </ul>
    </section>
  {:else}
    <p class="muted">{learnings.length ? t('Nothing matches.') : t('No learnings yet. They come from your Excel import and from every debrief.')}</p>
  {/each}
</section>

<style>
  .q {
    width: 100%;
    min-height: 44px;
    box-sizing: border-box;
  }
  .count {
    margin: 8px 0 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .topic {
    margin-top: 16px;
  }
  h3 {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 0 0 4px;
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  h3 .n {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--paper);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    overflow: hidden;
  }
  li {
    display: grid;
    gap: 2px;
    padding: 10px 14px;
    overflow-wrap: break-word;
  }
  li + li {
    border-top: 1px solid var(--line);
  }
  small {
    font-size: var(--fs-small);
  }
  .do {
    color: var(--ink-2);
  }
  .muted {
    color: var(--ink-3);
  }
</style>
