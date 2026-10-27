<script>
  /**
   * Noah 26.10.2026 «8a» «Geräusch-Notiz»: on the page «Verschleiss», note a noise («creaks when pedalling»)
   * with the day and the bike's km. Matching tips from the bike FAQ show below it; once a part was changed or
   * serviced after the note, the app asks «Is it gone?». Notes: add, rename, mark gone (and back), delete with Undo.
   * bike: as stored; view: with the workshop jobs (for «Is it gone?»).
   */
  import { Ear, Pencil, Trash2, Check, RotateCcw, Plus } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, num, dateOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { partName } from '../care.js';
  import { FAQ } from '../velofaq.js';
  import { noisesOf, addNoise, renameNoise, removeNoise, solveNoise, reopenNoise, noiseTips, noiseAsk } from '../griff.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';

  let { bike, view = bike } = $props();
  const today = localDay();
  const notes = $derived(noisesOf(bike).slice().reverse());
  const open = $derived(notes.filter((n) => !n.done));
  const gone = $derived(notes.filter((n) => n.done));
  const tipsOf = (n) => noiseTips(n.text).map((k) => FAQ.find((f) => f.key === k)).filter(Boolean).slice(0, 2);
  let text = $state('');
  let editing = $state(null);
  let editText = $state('');
  let msg = $state('');

  // always from the stored bike, so two quick changes do not undo each other
  async function store(fn, done) {
    const b = await db.bikes.get(bike.id);
    const patch = b && fn(b);
    if (!patch) return;
    const before = JSON.parse(JSON.stringify(b.noises ?? []));
    await db.bikes.update(bike.id, patch);
    if (done) offerDone(done, () => db.bikes.update(bike.id, { noises: before }));
  }
  async function add(e) {
    e.preventDefault();
    if (!text.trim()) return (msg = t('Describe the noise, e.g. creaks when pedalling.'));
    await store((b) => addNoise(b, text, `nz-${Date.now().toString(36)}`, today), t('Noise noted.'));
    text = '';
    msg = '';
  }
  async function rename(e, n) {
    e.preventDefault();
    if (!editText.trim()) return (msg = t('Describe the noise, e.g. creaks when pedalling.'));
    await store((b) => renameNoise(b, n.id, editText));
    editing = null;
    msg = '';
  }
  async function remove(n) {
    if ((await askDelete({ title: t('Delete "{name}"?', { name: n.text }), text: t('Only this note goes.') })) !== 'delete') return;
    await deleteWithUndo({
      name: n.text,
      text: t('"{name}" deleted.', { name: n.text }),
      run: async () => {
        const b = await db.bikes.get(bike.id);
        await db.bikes.update(bike.id, removeNoise(b, n.id));
        return b.noises ?? [];
      },
      undo: (before) => db.bikes.update(bike.id, { noises: before }),
    });
  }
</script>

<section class="gcard" aria-labelledby="nz-h-{bike.id}" data-noises>
  <h2 id="nz-h-{bike.id}"><Ear size={18} aria-hidden="true" />{t('Noises')}</h2>
  <p class="quiet">{t('Note a noise with the day and the km. The app shows tips and asks after the next change whether it is gone.')}</p>
  {#if open.length}
    <ul class="list">
      {#each open as n (n.id)}
        {@const ask = noiseAsk(view, n)}
        <li class="nz" data-noise={n.id}>
          {#if editing === n.id}
            <form class="row grow" onsubmit={(e) => rename(e, n)}>
              <input class="inp grow" type="text" maxlength="200" bind:value={editText} aria-label={t('Noise')} />
              <button type="submit" class="btn sm">{t('Save')}</button>
              <button type="button" class="btn sm" onclick={() => (editing = null)}>{t('Cancel')}</button>
            </form>
          {:else}
            <div class="row">
              <span class="grow"><b>{n.text}</b><br /><small class="quiet num">{dateOf(n.date)}{#if n.km != null}{' · '}{t('{km} km', { km: num(n.km) })}{/if}</small></span>
              <button type="button" class="ib" aria-label={t('Edit {name}', { name: n.text })} onclick={() => ((editing = n.id), (editText = n.text))}><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" class="ib" aria-label={t('Delete {name}', { name: n.text })} onclick={() => remove(n)}><Trash2 size={16} aria-hidden="true" /></button>
            </div>
            {#if ask}
              <p class="warn" data-noise-ask>{t('{part} was done since. Is the noise gone?', { part: partName({ key: ask }) })}
                <button type="button" class="btn sm" onclick={() => store((b) => solveNoise(b, n.id, today), t('Good: marked as gone.'))} data-noise-gone><Check size={14} aria-hidden="true" />{t('Yes, gone')}</button></p>
            {:else}
              <p><button type="button" class="lnk" onclick={() => store((b) => solveNoise(b, n.id, today), t('Good: marked as gone.'))} data-noise-gone><Check size={14} aria-hidden="true" />{t('It is gone')}</button></p>
            {/if}
            {#each tipsOf(n) as f (f.key)}
              <details class="tip" data-noise-tip={f.key}><summary>{t(f.q)}</summary><p>{t(f.a)}</p></details>
            {/each}
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
  <form class="row" onsubmit={add}>
    <input class="inp grow" type="text" maxlength="200" placeholder={t('e.g. creaks when pedalling')} aria-label={t('New noise')} bind:value={text} data-noise-new />
    <button type="submit" class="btn sm" data-noise-add><Plus size={16} aria-hidden="true" />{t('Note it')}</button>
  </form>
  {#if msg}<p class="err" role="alert">{msg}</p>{/if}
  {#if gone.length}
    <details class="tip"><summary>{t('Gone ({n})', { n: gone.length })}</summary>
      <ul class="list">
        {#each gone as n (n.id)}
          <li data-noise-done={n.id}><span class="grow">{n.text} <small class="quiet">{t('gone on {date}', { date: dateOf(n.done) })}</small></span><button type="button" class="ib" aria-label={t('Back to open: {name}', { name: n.text })} onclick={() => store((b) => reopenNoise(b, n.id))}><RotateCcw size={16} aria-hidden="true" /></button><button type="button" class="ib" aria-label={t('Delete {name}', { name: n.text })} onclick={() => remove(n)}><Trash2 size={16} aria-hidden="true" /></button></li>
        {/each}
      </ul>
    </details>
  {/if}
</section>

<style>
  .nz {
    display: block;
  }
  .tip summary {
    min-height: 40px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--accent);
  }
  .tip p {
    margin: 0 0 8px;
  }
</style>
