<script>
  /**
   * v0.61.0 R2 «Gelernt» (Noah ★a): every learning in one flat list by topic, nothing folded: the
   * topic with the most learnings first, the important ones first in a topic. A search on top.
   * (R1 left this page as it was: topics folded shut.)
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { learnedOn } from '../yearreview.js';
  import { dayLong } from './fmt.js';
  import { t, tn, num } from '../i18n.svelte.js';
  import { Lightbulb, Search } from '@lucide/svelte';
  import './review.css';

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
  const meta = (l) => [l.source === 'import' ? t('From the import') : l.source, learnedOn(l) ? dayLong(learnedOn(l)) : ''].filter(Boolean).join(' · ');
</script>

<!-- v0.109.0 Design-Refresh P6 (T18 «Gelernt», approved 12.10.2026): the count line, the search with its icon,
     then one section per topic (name, «n Learnings») with the learnings as rows: icon, the rule, where it
     comes from, «hoch» and «n× bestätigt» on the right. -->
<section id="learnings" class="learned" aria-labelledby="learn-h">
  <h2 id="learn-h" class="sr">{t('Learnings')}</h2>
  <p class="count num">{t('{n} learnings in {k} topics', { n: num(learnings.length), k: num(topics.length) })}</p>
  <label class="rv-search"><Search size={18} aria-hidden="true" /><input type="search" placeholder={t('Search learnings')} bind:value={lq} aria-label={t('Search learnings')} /></label>
  {#each topics as g (g.topic)}
    <section class="topic rv-sec" aria-label={topicName(g.topic)}>
      <div class="rv-h"><div><h3>{topicName(g.topic)}</h3><p class="rv-sub num">{tn(g.ls.length, '{n} learning', '{n} learnings')}</p></div></div>
      <ul class="rv-box">
        {#each g.ls as l (l.id)}
          <li class="rv-row">
            <span class="rv-ic" aria-hidden="true"><Lightbulb size={18} /></span>
            <span class="rv-m"><span class="rv-t rule">{l.rule}</span>{#if l.action}<span class="rv-s do">→ {l.action}</span>{/if}{#if meta(l)}<span class="rv-s">{meta(l)}</span>{/if}</span>
            {#if l.priority === 'high' || l.confirmed}<span class="rv-v tags">{#if l.priority === 'high'}<span class="rv-tag">{t('high')}</span>{/if}{#if l.confirmed}<span>{t('confirmed {n}×', { n: l.confirmed })}</span>{/if}</span>{/if}
          </li>
        {/each}
      </ul>
    </section>
  {:else}
    <p class="muted">{learnings.length ? t('Nothing matches.') : t('No learnings yet. They come from your Excel import and from every debrief.')}</p>
  {/each}
</section>

<style>
  .learned {
    max-width: 760px;
  }
  .count {
    margin: -8px 0 16px;
    color: var(--ink-3);
    font-size: var(--fs-body);
  }
  .topic {
    margin-top: 24px;
  }
  h3 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .do {
    color: var(--ink-2);
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 4px 8px;
    max-width: 40%;
    white-space: nowrap;
  }
  .muted {
    color: var(--ink-3);
  }
  @media (max-width: 559px) {
    .rv-row {
      flex-wrap: wrap;
      row-gap: 2px;
    }
    .rv-m {
      flex-basis: calc(100% - 56px);
    }
    .tags {
      max-width: none;
      margin-left: 46px;
    }
  }
</style>
