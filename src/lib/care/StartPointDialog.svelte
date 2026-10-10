<script>
  /**
   * v0.68.0 «Q1 Jeder km zählt» (Q1.7 a, step 3 in its simple form): the start point of a part: when
   * it was mounted and the bike's km then (suggested from the ride ledger). A part that came from
   * another bike (a wheelset, tyres) brings its km along: «km already on the part», suggested from
   * that bike's same part. Saving adds a mounting entry to the part's history; nothing is overwritten.
   * missing: the keys of the bike's parts still without a start point («Next» walks through them).
   */
  import { backClose } from '../ui/backclose.js';
  import { localDay } from '../localday.js';
  import DateInput from '../ui/DateInput.svelte';
  import { kmOn, partStart, partKm } from '../kmbook.js';
  import { parseKm, partName, ensureParts } from '../care.js';
  import { t, num } from '../i18n.svelte.js';

  let { bike, part, bikes = [], entries = [], missing = [], onsave, onnext, onclose } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const firstDay = $derived(entries.filter((e) => e.bikeId === bike.id && e.kind === 'start').map((e) => e.date).sort()[0] ?? bike.bought ?? null);
  const had = partStart(part);
  let date = $state(had?.date ?? firstDay ?? localDay());
  let kmText = $state('');
  let kmTyped = $state(false);
  let from = $state(had?.from ?? '');
  let carriedText = $state(had?.carried ? String(had.carried) : '0');
  let carriedTyped = $state(!!had?.carried);
  let err = $state('');
  const suggestKm = $derived(kmOn(entries, bike.id, date));
  $effect(() => {
    if (!kmTyped) kmText = had && date === had.date ? String(had.km) : suggestKm != null ? String(suggestKm) : '';
  });
  // the same part on the other bike: its km are what it brings along
  const otherKm = $derived.by(() => {
    const b = bikes.find((x) => x.id === from);
    if (!b) return null;
    const p = ensureParts(b).find((x) => x.key === part.key);
    return p ? partKm(b, p) : null;
  });
  $effect(() => {
    if (!carriedTyped) carriedText = from ? String(otherKm ?? 0) : '0';
  });
  const others = $derived(bikes.filter((b) => b.id !== bike.id));
  const nextKey = $derived(missing.find((k) => k !== part.key) ?? null);

  async function save(andNext) {
    const km = parseKm(kmText);
    const carried = parseKm(carriedText) ?? 0;
    if (km == null || Number.isNaN(km) || Number.isNaN(carried)) return (err = t('Type the km as a whole number, e.g. 12400.'));
    if (!date) return (err = t('Choose a date'));
    await onsave({ date, km, value: null, action: 'replace', result: 'done', by: null, model: null, note: '', start: true, carried, from: from || null });
    if (andNext && nextKey) onnext?.(nextKey);
    else dialog.close();
  }
</script>

<dialog class="sheet spd" bind:this={dialog} use:backClose onclose={onclose} aria-labelledby="sp-h">
  <h2 id="sp-h" class="title">{t('Start point: {part}', { part: partName(part) })}</h2>
  <p class="quiet">{t('When was it mounted, and how many km did {bike} have then? From this the app counts the km of the part, also across bikes.', { bike: bike.name })}</p>
  <div class="fields">
    <label><span class="lbl">{t('Mounted on')}</span><DateInput bind:value={date} /></label>
    <label><span class="lbl">{t('Bike km then')}</span><input class="inp num" type="text" inputmode="numeric" value={kmText} oninput={(e) => ((kmText = e.currentTarget.value), (kmTyped = true))} /></label>
    {#if suggestKm != null && !kmTyped}<p class="hint">{t('From the ride ledger: {km} km on that day.', { km: num(suggestKm) })}</p>{/if}
    <label><span class="lbl">{t('Came from another bike?')}</span>
      <select class="sel" bind:value={from}>
        <option value="">{t('No, new or from the factory')}</option>
        {#each others as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
      </select>
    </label>
    {#if from}
      <label><span class="lbl">{t('km already on the part')}</span><input class="inp num" type="text" inputmode="numeric" value={carriedText} oninput={(e) => ((carriedText = e.currentTarget.value), (carriedTyped = true))} /></label>
    {/if}
  </div>
  {#if err}<p class="err" role="alert">{err}</p>{/if}
  <div class="fb">
    {#if nextKey}<button type="button" class="btn hi" onclick={() => save(true)}>{t('Save and next')}</button><button type="button" class="btn" onclick={() => save(false)}>{t('Save')}</button>
    {:else}<button type="button" class="btn hi" onclick={() => save(false)}>{t('Save')}</button>{/if}
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
  </div>
</dialog>

<style>
  .spd {
    max-width: 520px;
  }
  .quiet {
    margin: 6px 0 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fields {
    display: grid;
    gap: 10px;
  }
  .hint {
    margin: -4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .err {
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .fb {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }
</style>
