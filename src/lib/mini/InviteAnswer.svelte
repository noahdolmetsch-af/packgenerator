<script>
  /**
   * Mini-Tools «Spontan-Einladung» (idea 5): what the people asked see (#/mitmachen/<id>/<key>): day, meeting point,
   * route and weather, then name and «I am in», «Maybe» or «Not this time». The answer can be changed.
   * The answer is locked for the maker alone (client.js sealFor).
   * invite: read from the link (einladung.js readInvite), id: the server id.
   */
  import { untrack } from 'svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import InviteFacts from './InviteFacts.svelte';
  import { sendAnswer, MINI_ERRORS } from './client.js';
  import { readJoined, saveJoined } from './store.js';
  import { cleanReply, cleanName, REPLIES } from './einladung.js';
  import { Lock } from '@lucide/svelte';

  let { invite, id } = $props();
  const q = untrack(() => invite);
  let name = $state('');
  let note = $state('');
  let reply = $state('');
  let mine = $state.raw(null);
  let busy = $state(false);
  let err = $state('');
  let sent = $state('');

  $effect(() => {
    untrack(async () => {
      try {
        const j = (await readJoined(db))[id];
        if (j?.aid) {
          mine = { aid: j.aid, del: j.del };
          name = j.name ?? '';
          note = j.note ?? '';
          reply = j.reply ?? '';
          sent = t('You already answered. You can change your answer and send it again.');
        }
      } catch {
        /* no storage in this browser: the answer can still be sent once */
      }
    });
  });

  async function send(key) {
    err = '';
    if (!cleanName(name)) return (err = t('Write your name first, so they know who answered.'));
    const answer = cleanReply({ name, note, reply: key });
    busy = true;
    try {
      const r = await sendAnswer(id, q.pk, answer, mine);
      mine = { aid: r.aid, del: r.del };
      reply = key;
      try {
        await saveJoined(db, id, { aid: r.aid, del: r.del, ...answer, at: r.at });
      } catch {
        /* not kept here */
      }
      sent = key === 'y' ? t('Great, you are in. You can change it until the ride.') : key === 'm' ? t('Noted as maybe. Tap again when you know.') : t('Noted. Maybe next time.');
    } catch (e) {
      err = t(MINI_ERRORS[e?.code] ?? MINI_ERRORS.server_error);
    } finally {
      busy = false;
    }
  }
</script>

<header>
  <p class="kick">{q.by ? t('{name} asks', { name: q.by }) : t('Quick invite')}</p>
  <h1 data-page-title tabindex="-1">{q.title || t('Are you riding with me?')}</h1>
  {#if q.note}<p class="sub">{q.note}</p>{/if}
</header>
<div class="card ia-box" data-ia>
  <InviteFacts {q} />
  <label class="ia-fld"><span>{t('Your name')}</span><input type="text" bind:value={name} maxlength="40" autocomplete="given-name" data-ia-name /></label>
  <label class="ia-fld"><span>{t('A note (optional)')}</span><input type="text" bind:value={note} maxlength="120" placeholder={t('e.g. I come to the meeting point a bit later')} data-ia-note /></label>
  <div class="ia-replies" role="radiogroup" aria-label={t('Your answer')}>
    {#each REPLIES as r (r.key)}
      <button type="button" role="radio" class={`ia-r r-${r.key}`} class:on={reply === r.key} aria-checked={reply === r.key} disabled={busy} onclick={() => send(r.key)} data-ia-reply={r.key}>{t(r.label)}</button>
    {/each}
  </div>
  {#if err}<p class="ia-err" role="alert" data-ia-err>{err}</p>{/if}
  {#if sent}<p class="ia-ok" role="status" data-ia-sent>{sent}</p>{/if}
</div>
<p class="ia-help"><Lock size={14} aria-hidden="true" /> {t('No app and no account needed. Only the person who asked can read your answer; the server cannot read it and deletes it by itself.')}</p>

<style>
  .kick {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  h1 {
    margin: 0;
    text-wrap: balance;
  }
  .sub {
    margin: var(--sp-1) 0 0;
    color: var(--ink-2);
  }
  .ia-box {
    display: grid;
    gap: var(--sp-3);
  }
  .ia-fld {
    display: grid;
    gap: var(--sp-1);
  }
  .ia-fld > span {
    font-weight: 600;
  }
  .ia-fld input {
    min-height: 44px;
    width: 100%;
    box-sizing: border-box;
  }
  .ia-replies {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .ia-r {
    min-height: 52px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    padding: 6px;
  }
  .ia-r.on.r-y {
    background: var(--ok-soft);
    border-color: var(--ok);
  }
  .ia-r.on.r-m {
    background: var(--warn-soft);
    border-color: var(--warn);
  }
  .ia-r.on.r-n {
    background: var(--bad-soft);
    border-color: var(--bad);
  }
  .ia-r:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .ia-err {
    margin: 0;
    color: var(--bad);
    font-weight: 600;
  }
  .ia-ok {
    margin: 0;
    font-weight: 600;
  }
  .ia-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
