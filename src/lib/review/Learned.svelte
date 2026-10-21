<script>
  /**
   * v0.61.0 R2 «Gelernt» (Noah ★a): every learning in one flat list by topic, nothing folded: the
   * topic with the most learnings first, the important ones first in a topic. A search on top.
   * (R1 left this page as it was: topics folded shut.)
   * «Gruppen überall» (Noah 18.10.2026): each topic can be renamed (every learning of it) and deleted;
   * deleting asks where the learnings go (another topic, or «Ohne Thema»), then Undo.
   */
  import { liveQuery } from 'dexie';
  import Empty from '../ui/Empty.svelte';
  import { db } from '../db.js';
  import { learnedOn } from '../yearreview.js';
  import { dayLong } from './fmt.js';
  import { t, tn, num } from '../i18n.svelte.js';
  import { Lightbulb, Search, Pencil, Trash2, Plus } from '@lucide/svelte';
  import LearningSheet from './LearningSheet.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import UndoToast from './UndoToast.svelte';
  import { retopicLearnings, writeGroupChange, undoGroupChange, FIXED_LEARN_TOPICS } from '../groups.js';
  import { phone } from '../media.svelte.js';
  import './review.css';

  const learnQ = liveQuery(() => db.learnings.toArray());
  // 0.161.0 (Bugfixes 0.132.2 B3): an archived learning («Clean up test data») is gone from the list
  const learnings = $derived(($learnQ ?? []).filter((l) => !l.archivedAt));
  let lq = $state('');
  // v0.30.2 (test R6.12): topics typed in small letters ("gear") are shown like the others.
  const topicName = (topic) => {
    const s = String(topic ?? '');
    if (!s) return t('No topic');
    return t(s) !== s ? t(s) : t(s.charAt(0).toUpperCase() + s.slice(1));
  };
  const topics = $derived.by(() => {
    const q = lq.trim().toLowerCase();
    const list = learnings.filter((l) => !q || `${l.topic} ${topicName(l.topic)} ${l.rule} ${l.action ?? ''} ${l.source ?? ''}`.toLowerCase().includes(q));
    const map = new Map();
    for (const l of list) map.set(l.topic ?? '', [...(map.get(l.topic ?? '') ?? []), l]);
    const rank = { high: 0, medium: 1, low: 2 };
    return [...map].map(([topic, ls]) => ({ topic, ls: ls.sort((a, b) => (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3)) })).sort((a, b) => b.ls.length - a.ls.length || topicName(a.topic).localeCompare(topicName(b.topic)));
  });
  // «Gruppen überall»: rename and delete a topic (the whole topic, not only what the search shows)
  let renaming = $state(null); // the topic
  // «Alles selbst bearbeiten» (Noah 19.10.2026): a tap on a learning opens it; «+ Learning» adds one
  let editing = $state(null); // { learning } (learning null: new)
  let deleting = $state(null);
  let undo = $state.raw(null); // raw: IndexedDB cannot store a reactive proxy
  let timer;
  $effect(() => () => clearTimeout(timer));
  const allTopics = $derived([...new Set(learnings.map((l) => l.topic ?? ''))]);
  const editable = (topic) => !!topic && !FIXED_LEARN_TOPICS.includes(topic);
  const sizeOf = (topic) => learnings.filter((l) => (l.topic ?? '') === topic).length;
  async function move(from, to, text) {
    const changed = retopicLearnings(learnings, from, to);
    if (!changed.length) return;
    const snap = await writeGroupChange(db, { learnings: changed });
    clearTimeout(timer);
    undo = { text, snap };
    timer = setTimeout(() => (undo = null), 8000);
  }
  async function doUndo() {
    const snap = undo?.snap;
    clearTimeout(timer);
    undo = null;
    await undoGroupChange(db, snap);
  }
  const meta = (l) => [l.source === 'import' ? t('From the import') : l.source, learnedOn(l) ? dayLong(learnedOn(l)) : ''].filter(Boolean).join(' · ');
  // Gesamttest 20.10.2026 (C11): 79 learnings made the page 18 phone screens long; 5 per topic, then «n weitere» (a search shows all)
  // Gesamttest 21.10.2026 (C4): still 17 phone screens with a big import; on a phone 3 per topic, and after
  // the 6th topic the rest waits behind «n weitere Themen»
  const PER_TOPIC = $derived(phone.matches ? 3 : 5);
  const TOPICS_FIRST = 6;
  let openTopics = $state({});
  let allTopics = $state(false);
  const shownTopics = $derived(lq.trim() || allTopics ? topics : topics.slice(0, TOPICS_FIRST));
</script>

<!-- v0.109.0 Design-Refresh P6 (T18 «Gelernt», approved 12.10.2026): the count line, the search with its icon,
     then one section per topic (name, «n Learnings») with the learnings as rows: icon, the rule, where it
     comes from, «hoch» and «n× bestätigt» on the right. -->
<section id="learnings" class="learned" aria-labelledby="learn-h">
  <h2 id="learn-h" class="sr">{t('Learnings')}</h2>
  <div class="lhead">
    <p class="count num">{t('{n} learnings in {k} topics', { n: num(learnings.length), k: num(topics.length) })}</p>
    <button type="button" class="btn" onclick={() => (editing = { learning: null })}><Plus size={16} aria-hidden="true" />{t('Learning')}</button>
  </div>
  <label class="rv-search"><Search size={18} aria-hidden="true" /><input type="search" placeholder={t('Search learnings')} bind:value={lq} aria-label={t('Search learnings')} /></label>
  {#each shownTopics as g (g.topic)}
    <section class="topic rv-sec" aria-label={topicName(g.topic)}>
      <div class="rv-h">
        <div><h3>{topicName(g.topic)}</h3><p class="rv-sub num">{tn(g.ls.length, '{n} learning', '{n} learnings')}</p></div>
        {#if editable(g.topic)}
          <span class="gacts">
            <button type="button" class="gbtn" aria-label={t('Rename topic {name}', { name: topicName(g.topic) })} onclick={() => (renaming = g.topic)}><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="gbtn" aria-label={t('Delete topic {name}', { name: topicName(g.topic) })} onclick={() => (deleting = g.topic)}><Trash2 size={16} aria-hidden="true" /></button>
          </span>
        {/if}
      </div>
      <ul class="rv-box">
        {#each lq.trim() || openTopics[g.topic] ? g.ls : g.ls.slice(0, PER_TOPIC) as l (l.id)}
          <li class="rv-row lrn-row">
            <button type="button" class="ltap" aria-label={t('Edit learning: {name}', { name: l.rule })} onclick={() => (editing = { learning: l })}></button>
            <span class="rv-ic" aria-hidden="true"><Lightbulb size={18} /></span>
            <span class="rv-m"><span class="rv-t rule">{l.rule}</span>{#if l.action}<span class="rv-s do">→ {l.action}</span>{/if}{#if meta(l)}<span class="rv-s">{meta(l)}</span>{/if}</span>
            {#if l.priority === 'high' || l.confirmed}<span class="rv-v tags">{#if l.priority === 'high'}<span class="rv-tag">{t('high')}</span>{/if}{#if l.confirmed}<span>{t('confirmed {n}×', { n: l.confirmed })}</span>{/if}</span>{/if}
          </li>
        {/each}
      </ul>
      {#if !lq.trim() && !openTopics[g.topic] && g.ls.length > PER_TOPIC}<button type="button" class="lmore" onclick={() => (openTopics = { ...openTopics, [g.topic]: true })} data-topic-more>{t('Show {n} more', { n: g.ls.length - PER_TOPIC })}</button>{/if}
    </section>
  {:else}
    <Empty icon={Lightbulb} text={learnings.length ? t('Nothing matches.') : t('No learnings yet. They come from your Excel import and from every debrief.')} action={learnings.length ? null : { label: t('To the look back'), href: '#/debrief' }} />
  {/each}
  {#if shownTopics.length < topics.length}<button type="button" class="lmore" onclick={() => (allTopics = true)} data-topics-more>{tn(topics.length - shownTopics.length, 'Show {n} more topic', 'Show {n} more topics')}</button>{/if}
</section>

{#if renaming}
  {@const from = renaming}
  <RenameSheet
    kicker={t('Topic')}
    title={t('Rename topic')}
    value={topicName(from)}
    hint={tn(sizeOf(from), 'Changes {n} learning.', 'Changes {n} learnings.')}
    onsave={(name) => move(from, name, t('Renamed to "{name}".', { name }))}
    onclose={() => (renaming = null)}
  />
{/if}
{#if deleting}
  {@const from = deleting}
  <GroupDeleteSheet
    title={t('Delete topic «{name}»?', { name: topicName(from) })}
    count={sizeOf(from)}
    what={(n) => tn(n, '{n} learning', '{n} learnings')}
    none={t('No topic')}
    targets={allTopics.filter((x) => x && x !== from).map((x) => ({ id: x, name: topicName(x) }))}
    onconfirm={(to) => move(from, to ?? '', t('«{name}» deleted.', { name: topicName(from) }))}
    onclose={() => (deleting = null)}
  />
{/if}
{#if editing}
  <LearningSheet learning={editing.learning} topics={allTopics} {topicName} onclose={() => (editing = null)} />
{/if}
{#if undo}<UndoToast text={undo.text} onundo={doUndo} />{/if}

<style>
  .lmore {
    min-height: 44px;
    margin-top: var(--sp-1);
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
  }
  .lhead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .lrn-row {
    position: relative;
  }
  /* the whole row opens the learning; the button lies over it, the text stays selectable for screen readers */
  .ltap {
    position: absolute;
    inset: 0;
    width: 100%;
    border: 0;
    background: none;
    cursor: pointer;
    border-radius: inherit;
  }
  .ltap:hover {
    background: color-mix(in srgb, var(--ink) 4%, transparent);
  }
  .gacts {
    display: flex;
    flex: none;
    gap: 2px;
  }
  .gbtn {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .gbtn:hover {
    background: var(--paper-2);
  }
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
