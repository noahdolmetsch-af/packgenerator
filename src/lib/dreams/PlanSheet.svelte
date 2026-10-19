<script>
  /**
   * Paket N (19.10.2026): «Tour planen» from a dream (#32) or a race (#1008). One form: name, start day
   * (suggested: the race day, or the first Saturday of the dream's next season window), days, the bike
   * and, for a race, the registration deadline (optional). Saving makes the trip; the page does the write.
   * onsave({ name, start, days, bike, signupBy }) may be async.
   */
  import { backClose } from '../ui/backclose.js';
  import DateInput from '../ui/DateInput.svelte';
  import Form from '../ui/Form.svelte';
  import Field from '../ui/Field.svelte';
  import ChipChoice from '../ui/ChipChoice.svelte';
  import { checkAll } from '../ui/formchecks.js';
  import { t } from '../i18n.svelte.js';
  import { X } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { title = '', sub = '', name: name0 = '', start: start0 = '', days: days0 = 2, race = false, bikes = [], onsave, onclose } = $props();

  let dialog;
  // svelte-ignore state_referenced_locally
  let name = $state(name0);
  // svelte-ignore state_referenced_locally
  let start = $state(start0);
  // svelte-ignore state_referenced_locally
  let days = $state(String(days0));
  let signupBy = $state('');
  // svelte-ignore state_referenced_locally
  let bike = $state(bikes[0]?.id ?? null);
  let errors = $state({});
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const check = () =>
    checkAll(
      {
        name: [name, { field: t('a name|field'), example: t('Jura weekend'), required: true, maxLen: 80 }],
        start: [start, { field: t('When'), kind: 'date' }],
        days: [days, { field: t('Days'), example: '2', kind: 'int', min: 1, max: 60, required: true }],
        ...(race ? { signup: [signupBy, { field: t('Registration deadline'), kind: 'date' }] } : {}),
        bike: [bikes.some((x) => x.id === bike) ? bike : null, { field: t('a bike|field'), example: bikes[0]?.name ?? '', kind: 'choice', required: true }],
      },
      t,
    );
  async function save() {
    await onsave?.({ name: name.trim(), start: start || null, days: Number(days) || 1, bike: bikes.find((b) => b.id === bike), signupBy: signupBy || '' });
    dialog.close();
  }
</script>

<dialog use:backClose class="sheet vdlg plansheet" bind:this={dialog} {onclose} aria-labelledby="plan-h">
  <div class="vd-head">
    <div class="vd-t"><h2 id="plan-h" class="title">{title}</h2>{#if sub}<p class="vd-sub">{sub}</p>{/if}</div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  {#if !bikes.length}
    <p class="err" role="alert">{t('A trip draft needs a bike first.')} <a href="#/bikes">{t('Bikes|place')}</a></p>
  {:else}
    <Form {check} bind:errors onsave={save} oncancel={() => dialog.close()} saveLabel={t('Create the trip')}>
      <Field id="pl-name" label={t('Name')} example={t('e.g. Jura weekend')} error={errors.name}>
        {#snippet children(f)}<input class="inp" type="text" {...f.attrs} bind:value={name} autocomplete="off" maxlength="80" />{/snippet}
      </Field>
      <div class="two">
        <Field id="pl-when" label={t('When')} optional example={t('Suggested from the season; leave it empty if you do not know yet.')} error={errors.start}>
          {#snippet children(f)}<DateInput {...f.attrs} bind:value={start} />{/snippet}
        </Field>
        <Field id="pl-days" label={t('Days')} example={t('1 to 60')} error={errors.days}>
          {#snippet children(f)}<input class="inp num" type="text" inputmode="numeric" {...f.attrs} bind:value={days} />{/snippet}
        </Field>
      </div>
      {#if race}
        <Field id="pl-signup" label={t('Registration deadline')} optional example={t('«Dreams» shows it until you tick «Signed up».')} error={errors.signup}>
          {#snippet children(f)}<DateInput {...f.attrs} bind:value={signupBy} />{/snippet}
        </Field>
      {/if}
      <Field id="pl-bike" group label={t('Bike')} error={errors.bike}>
        {#snippet children(f)}<ChipChoice {...f.attrs} options={bikes.map((b) => ({ value: b.id, label: b.name }))} bind:value={bike} />{/snippet}
      </Field>
    </Form>
  {/if}
</dialog>

<style>
  .two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12em, 1fr));
    gap: 0 12px;
  }
</style>
