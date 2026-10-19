<script>
  /**
   * Paket O, extra blocks of Tennis (#65, Noah «3 a und b»): lessons with notes and drills (a drill that worked
   * gets a star and is collected on top), and matches with the result. kind: 'lesson' | 'match'.
   */
  import { Plus, Star, Pencil, Trash2, Trophy } from '@lucide/svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { putItem, patchItem, dropItems, restoreItems, newId } from '../sportsdb.js';
  import { goodDrills, matchStats } from '../sportshelp.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { sport, items = [], today, kind = 'lesson' } = $props();

  const list = $derived(items.filter((x) => x.kind === kind).sort((a, b) => String(b.day).localeCompare(String(a.day))));
  const good = $derived(kind === 'lesson' ? goodDrills(list) : []);
  const stats = $derived(kind === 'match' ? matchStats(list, today.slice(0, 4)) : null);
  const fmt = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const title = (x) => (kind === 'lesson' ? x.topic || t('Lesson') : [x.who, x.result].filter(Boolean).join(' · ') || t('Match'));

  let form = $state(null);
  const blank = () => (kind === 'lesson' ? { day: today, topic: '', notes: '', drills: [] } : { day: today, type: 'single', who: '', result: '', won: null, note: '' });
  async function save(e) {
    e.preventDefault();
    const { id, ...rec } = form;
    if (kind === 'lesson') rec.drills = rec.drills.filter((d) => d.text.trim());
    if (id) await patchItem(id, rec);
    else await putItem({ sport: sport.id, kind, ...rec });
    form = null;
  }
  async function del(x) {
    const name = `${title(x)} (${fmt(x.day)})`;
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text: t('Only this entry goes.') })) !== 'delete') return;
    await deleteWithUndo({ run: () => dropItems([x.id]), undo: restoreItems, text: t('"{name}" deleted.', { name }), name });
  }
  const starDrill = (x, d) => patchItem(x.id, { drills: x.drills.map((y) => (y.id === d.id ? { ...y, good: !y.good } : y)) });
  const addDrill = () => (form.drills = [...form.drills, { id: newId('d'), text: '', good: false }]);
</script>

{#if kind === 'lesson' && good.length}
  <h3><Star size={16} class="star" aria-hidden="true" /> {t('Drills that worked')}</h3>
  <p class="small" data-good-drills>{good.map((d) => d.text).join(' · ')}</p>
{/if}
{#if stats && stats.total}
  <p class="row" data-match-stats><Trophy size={16} aria-hidden="true" /><b class="num">{t('{won} won, {lost} lost', { won: stats.won, lost: stats.lost })}</b><span class="small">{tn(stats.total, '{n} match this year', '{n} matches this year')}</span></p>
{/if}

{#if list.length}
  <ul class="ilist">
    {#each list.slice(0, 20) as x (x.id)}
      <li data-entry={title(x)}>
        <div class="ent" style="flex-direction:column;align-items:flex-start">
          <b>{title(x)}{#if kind === 'match' && x.won != null}{' · '}<span class={x.won ? 'up' : 'down'}>{x.won ? t('won') : t('lost')}</span>{/if}</b>
          <small>{fmt(x.day)}{#if kind === 'match'}{' · '}{x.type === 'double' ? t('Doubles') : t('Singles')}{/if}</small>
          {#if x.notes || x.note}<small>{x.notes || x.note}</small>{/if}
          {#if kind === 'lesson' && x.drills?.length}
            <span class="row">
              {#each x.drills as d (d.id)}
                <button type="button" class="chip" aria-pressed={!!d.good} onclick={() => starDrill(x, d)} title={t('Mark: worked')}><Star size={14} class={d.good ? 'star' : ''} aria-hidden="true" />{d.text}</button>
              {/each}
            </span>
          {/if}
        </div>
        <button type="button" class="ibtn" aria-label={t('Change «{name}»', { name: title(x) })} onclick={() => (form = structuredClone($state.snapshot(x)))}><Pencil size={16} aria-hidden="true" /></button>
        <button type="button" class="ibtn" aria-label={t('Delete «{name}»', { name: title(x) })} onclick={() => del(x)}><Trash2 size={16} aria-hidden="true" /></button>
      </li>
    {/each}
  </ul>
{:else}
  <p class="none">{kind === 'lesson' ? t('No lesson yet. Note what you learned and the drills.') : t('No match yet.')}</p>
{/if}

{#if form}
  <form class="form" onsubmit={save} data-form={kind}>
    <label>{t('Day')}<input type="date" bind:value={form.day} /></label>
    {#if kind === 'lesson'}
      <label>{t('Topic')}<input bind:value={form.topic} placeholder={t('e.g. backhand slice')} /></label>
      <label class="wide">{t('Notes')}<textarea bind:value={form.notes}></textarea></label>
      <div class="wide">
        <p class="small">{t('Drills: tap the star when a drill worked.')}</p>
        {#each form.drills as d, i (d.id)}
          <div class="row">
            <label class="vh" for="dr-{d.id}">{t('Drill {n}', { n: i + 1 })}</label>
            <input id="dr-{d.id}" bind:value={d.text} placeholder={t('e.g. 20 cross-court balls')} />
            <button type="button" class="ibtn" aria-pressed={d.good} aria-label={t('Mark: worked')} onclick={() => (d.good = !d.good)}><Star size={16} class={d.good ? 'star' : ''} aria-hidden="true" /></button>
            <button type="button" class="ibtn" aria-label={t('Remove drill')} onclick={() => (form.drills = form.drills.filter((y) => y.id !== d.id))}><Trash2 size={16} aria-hidden="true" /></button>
          </div>
        {/each}
        <button type="button" class="chip dash" onclick={addDrill} data-add-drill><Plus size={14} aria-hidden="true" />{t('Drill')}</button>
      </div>
    {:else}
      <label>{t('Singles or doubles')}<select bind:value={form.type}><option value="single">{t('Singles')}</option><option value="double">{t('Doubles')}</option></select></label>
      <label>{t('Against')}<input bind:value={form.who} placeholder={t('optional')} /></label>
      <label>{t('Result')}<input bind:value={form.result} placeholder="6:4 3:6 10:8" /></label>
      <fieldset class="wide" style="border:0;padding:0;margin:0">
        <legend class="small">{t('Outcome')}</legend>
        <div class="row">
          <button type="button" class="chip" aria-pressed={form.won === true} onclick={() => (form.won = true)}>{t('won')}</button>
          <button type="button" class="chip" aria-pressed={form.won === false} onclick={() => (form.won = false)}>{t('lost')}</button>
          <button type="button" class="chip" aria-pressed={form.won == null} onclick={() => (form.won = null)}>{t('open|result')}</button>
        </div>
      </fieldset>
      <label class="wide">{t('Note')}<input bind:value={form.note} /></label>
    {/if}
    <button type="submit" class="btn hi">{t('Save')}</button>
    <button type="button" class="btn" onclick={() => (form = null)}>{t('Cancel')}</button>
  </form>
{:else}
  <button type="button" class="chip dash" onclick={() => (form = blank())} data-add={kind}><Plus size={14} aria-hidden="true" />{kind === 'lesson' ? t('New lesson') : t('New match')}</button>
{/if}
