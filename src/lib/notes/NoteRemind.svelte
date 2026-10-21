<script>
  /**
   * Paket NE 1150 (Noah 20.10.2026 «9a»): a reminder on a note, day and time. It comes as a message on
   * the phone (the reminders of Ich › Erinnerungen aufs Handy, kind «Note reminders») and, when it is due,
   * on top of Notes until «Done». Setting one switches that kind on when the reminders are on already;
   * when they are off, a line leads there.
   * value: bindable { at: 'YYYY-MM-DDTHH:MM', done? } or undefined.
   */
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { PUSH_KEY, pushOf } from '../push/schedule.js';
  import { BellOff } from '@lucide/svelte';

  let { value = $bindable() } = $props();
  let pushOn = $state(null); // null: not read yet
  let kindOn = $state(false);

  $effect(() => {
    db.settings
      .get(PUSH_KEY)
      .then((r) => {
        const p = pushOf(r?.value);
        pushOn = p.on;
        kindOn = p.kinds.note;
      })
      .catch(() => (pushOn = false));
  });

  /** In an hour, on the full hour (the first suggestion). */
  function soon() {
    const d = new Date(Date.now() + 36e5);
    return `${localDay(d)}T${String(d.getHours()).padStart(2, '0')}:00`;
  }
  async function set(at) {
    value = at ? { at } : undefined;
    if (at && pushOn && !kindOn) {
      const r = await db.settings.get(PUSH_KEY);
      const p = pushOf(r?.value);
      await db.settings.put({ key: PUSH_KEY, value: { ...(r?.value ?? {}), on: p.on, kinds: { ...p.kinds, note: true } } });
      kindOn = true;
    }
  }
  const at = $derived(value?.at ?? '');
  // svelte-ignore state_referenced_locally
  let pick = $state(value?.at || soon());
</script>

<div class="rem" data-note-remind>
  <label class="fld"><span class="lbl">{t('Remind me on')}</span><input class="inp" type="datetime-local" bind:value={pick} onchange={() => at && pick && set(pick)} data-remind-at /></label>
  {#if !at}<button type="button" class="btn sm hi" onclick={() => set(pick || soon())} data-remind-set>{t('Set the reminder')}</button>{/if}
  {#if at}<button type="button" class="btn sm" onclick={() => ((pick = soon()), set(''))} data-remind-off><BellOff size={16} aria-hidden="true" />{t('No reminder')}</button>{/if}
  {#if at && pushOn === false}
    <p class="q">{t('It shows on top of Notes when it is due. For a message on the phone, switch on')} <a href="#/me/push">{t('Reminders on the phone|guide')}</a>.</p>
  {:else if at}
    <p class="q">{t('It comes as a message on the phone and shows on top of Notes.')}</p>
  {/if}
</div>

<style>
  .rem {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px 10px;
    margin: 0 0 12px;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .rem .fld {
    flex: 1 1 14em;
    margin: 0;
  }
  .q {
    flex: 1 1 100%;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
