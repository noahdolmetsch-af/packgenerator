<script>
  /**
   * «Alles fertig» (Alles selbst bearbeiten, Runde 2; Noah 19.10.2026 «alle Daten … hinzugefügt»): a new own
   * entry in the logbook, e.g. an old trip without a packing list. Name, day and a note; it is a db.events
   * record like the ones from the Excel (rename and delete as those). onsave({ name, date, note }).
   */
  import { backClose } from '../ui/backclose.js';
  import DateInput from '../ui/DateInput.svelte';
  import Form from '../ui/Form.svelte';
  import Field from '../ui/Field.svelte';
  import { checkAll } from '../ui/formchecks.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';
  import { X } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { onsave, onclose } = $props();
  let dialog;
  let name = $state('');
  let date = $state(localDay());
  let note = $state('');
  let errors = $state({});
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const check = () =>
    checkAll(
      {
        name: [name, { field: t('a name|field'), example: t('Jura weekend'), required: true, maxLen: 80 }],
        date: [date, { field: t('When'), kind: 'date', required: true }],
      },
      t,
    );
  async function save() {
    await onsave?.({ name: name.trim(), date, note: note.trim() });
    dialog.close();
  }
</script>

<dialog use:backClose class="sheet vdlg" bind:this={dialog} {onclose} aria-labelledby="le-h" data-log-entry-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="le-h" class="title">{t('New logbook entry')}</h2><p class="vd-sub">{t('For a trip without a packing list, e.g. an older one.')}</p></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <Form {check} bind:errors onsave={save} oncancel={() => dialog.close()} saveLabel={t('Add the entry')}>
    <Field id="le-name" label={t('Name')} example={t('e.g. Jura weekend')} error={errors.name}>
      {#snippet children(f)}<input class="inp" type="text" {...f.attrs} bind:value={name} autocomplete="off" maxlength="80" />{/snippet}
    </Field>
    <Field id="le-date" label={t('When')} error={errors.date}>
      {#snippet children(f)}<DateInput {...f.attrs} bind:value={date} />{/snippet}
    </Field>
    <Field id="le-note" label={t('Note')} optional example={t('What you want to remember')}>
      {#snippet children(f)}<textarea class="inp" rows="3" {...f.attrs} bind:value={note}></textarea>{/snippet}
    </Field>
  </Form>
</dialog>
