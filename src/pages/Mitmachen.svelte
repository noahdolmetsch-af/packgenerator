<script>
  /**
   * Mini-Tools (Noah 28.10.2026 «1b»): what a link of a Mini-Tool opens for the people asked (#/mitmachen/<id>/<key>),
   * without the app's pages around it, without an account. The first kind: «Find a date» (idea 1): per day
   * «Works», «Maybe» or «Does not work», then «Send my answer». The answer is locked for the maker alone
   * (lib/mini/client.js sealFor); this device keeps a code to change it later (db.settings «mini-joined»).
   * The second kind: «Mini survey» (idea 2), answered one question at a time in lib/mini/PollAnswer.svelte.
   */
  import { untrack } from 'svelte';
  import { db } from '../lib/db.js';
  import { t, locale } from '../lib/i18n.svelte.js';
  import Empty from '../lib/ui/Empty.svelte';
  import { parseJoinLink, openQuestion, sendAnswer, MINI_ERRORS } from '../lib/mini/client.js';
  import { readJoined, saveJoined } from '../lib/mini/store.js';
  import PollAnswer from '../lib/mini/PollAnswer.svelte';
  import { readPoll } from '../lib/mini/poll.js';
  import ListAnswer from '../lib/mini/ListAnswer.svelte';
  import { readList } from '../lib/mini/liste.js';
  import InviteAnswer from '../lib/mini/InviteAnswer.svelte';
  import { readInvite } from '../lib/mini/einladung.js';
  import { readDateQuestion, cleanAnswer, cleanName, optKey, PICKS } from '../lib/mini/termin.js';
  import { CalendarCheck, Lock, Send } from '@lucide/svelte';

  let { hash = '' } = $props();
  const link = parseJoinLink(untrack(() => hash));
  let q = $state.raw(null);
  let poll = $state.raw(null);
  let list = $state.raw(null);
  let invite = $state.raw(null);
  let count = $state(0);
  let end = $state('');
  let err = $state(link ? '' : t(MINI_ERRORS.broken));
  let loaded = $state(false);
  let name = $state('');
  let note = $state('');
  let picks = $state({});
  let mine = $state.raw(null);
  let sending = $state(false);
  let sent = $state('');
  let sendErr = $state('');

  const dayFmt = (o) => `${new Date(`${o.d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}${o.t ? `, ${o.t}` : ''}`;
  const endFmt = (iso) => new Date(iso).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'Europe/Zurich' });

  $effect(() => {
    if (!link) return;
    untrack(async () => {
      try {
        const d = await openQuestion(link.id, link.key);
        const p = readPoll(d.question);
        const l = p ? null : readList(d.question);
        const inv = p || l ? null : readInvite(d.question);
        const read = p || l || inv ? null : readDateQuestion(d.question);
        if (inv) {
          invite = inv;
          end = d.end;
        } else if (l) {
          list = l;
          end = d.end;
          count = d.n ?? 0;
        } else if (p) {
          poll = p;
          end = d.end;
        } else if (!read) err = t(MINI_ERRORS.broken);
        else {
          q = read;
          end = d.end;
          try {
            const j = (await readJoined(db))[link.id];
            if (j) {
              mine = { aid: j.aid, del: j.del };
              name = j.name ?? '';
              note = j.note ?? '';
              picks = { ...(j.picks ?? {}) };
              sent = t('You already answered. You can change your answer and send it again.');
            }
          } catch {
            /* no storage in this browser: the answer can still be sent once */
          }
        }
      } catch (e) {
        err = t(MINI_ERRORS[e?.code] ?? MINI_ERRORS.server_error);
      } finally {
        loaded = true;
      }
    });
  });

  async function send(e) {
    e?.preventDefault?.();
    sendErr = '';
    if (!cleanName(name)) return (sendErr = t('Write your name first, so they know who answered.'));
    const answer = cleanAnswer({ name, picks, note }, q.opts);
    if (!Object.keys(answer.picks).length) return (sendErr = t('Tap an answer for at least one day.'));
    sending = true;
    try {
      const r = await sendAnswer(link.id, q.pk, answer, mine);
      mine = { aid: r.aid, del: r.del };
      try {
        await saveJoined(db, link.id, { aid: r.aid, del: r.del, ...answer, at: r.at });
      } catch {
        /* not kept here: the answer is sent all the same */
      }
      sent = t('Thank you, your answer is sent. You can change it until {day}.', { day: endFmt(end) });
    } catch (e2) {
      sendErr = t(MINI_ERRORS[e2?.code] ?? MINI_ERRORS.server_error);
    } finally {
      sending = false;
    }
  }
</script>

<div class="mm-page" data-mitmachen>
  {#if err}
    <Empty icon={CalendarCheck} title={t('Question not available')} text={err} />
  {:else if !loaded}
    <p class="mm-help">…</p>
  {:else if invite}
    <InviteAnswer {invite} id={link.id} />
  {:else if list}
    <ListAnswer {list} id={link.id} {end} n={count} />
  {:else if poll}
    <PollAnswer {poll} id={link.id} {end} />
  {:else}
    <header>
      <p class="kick">{q.by ? t('{name} asks', { name: q.by }) : t('Find a date')}</p>
      <h1 data-page-title tabindex="-1">{q.title}</h1>
      {#if q.note}<p class="sub">{q.note}</p>{/if}
      <p class="sub">{t('Which days work for you? Answers are possible until {day}.', { day: endFmt(end) })}</p>
    </header>
    <form class="card mm-box" onsubmit={send} data-mm-form>
      <label class="mm-fld"><span>{t('Your name')}</span><input type="text" bind:value={name} maxlength="40" autocomplete="given-name" data-mm-name /></label>
      <ul class="mm-opts">
        {#each q.opts as o (optKey(o))}
          {@const k = optKey(o)}
          <li data-mm-opt={k}>
            <span class="mm-day">{dayFmt(o)}</span>
            <span class="mm-picks" role="radiogroup" aria-label={dayFmt(o)}>
              {#each PICKS as p (p.key)}
                <button type="button" role="radio" class={`mm-pick p-${p.key}`} class:on={picks[k] === p.key} aria-checked={picks[k] === p.key} onclick={() => (picks = { ...picks, [k]: p.key })} data-mm-pick={p.key}>{t(p.label)}</button>
              {/each}
            </span>
          </li>
        {/each}
      </ul>
      <label class="mm-fld"><span>{t('A note (optional)')}</span><input type="text" bind:value={note} maxlength="200" data-mm-note /></label>
      {#if sendErr}<p class="mm-err" role="alert" data-mm-err>{sendErr}</p>{/if}
      <button type="submit" class="btn hi" disabled={sending} data-mm-send><Send size={18} aria-hidden="true" />{mine ? t('Send the changed answer') : t('Send my answer')}</button>
      {#if sent}<p class="mm-ok" role="status" data-mm-sent>{sent}</p>{/if}
    </form>
    <p class="mm-help"><Lock size={14} aria-hidden="true" /> {t('No app and no account needed. Only the person who asked can read your answer; the server cannot read it and deletes it by itself.')}</p>
  {/if}
</div>

<style>
  .mm-page {
    display: grid;
    gap: var(--sp-4);
    max-width: 640px;
    margin: 0 auto;
    padding: var(--sp-4) var(--sp-4) var(--sp-6);
  }
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
  .mm-box {
    display: grid;
    gap: var(--sp-3);
  }
  .mm-fld {
    display: grid;
    gap: var(--sp-1);
  }
  .mm-fld > span {
    font-weight: 600;
  }
  .mm-fld input {
    min-height: 44px;
    width: 100%;
    box-sizing: border-box;
  }
  .mm-opts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-3);
  }
  .mm-opts li {
    display: grid;
    gap: 6px;
  }
  .mm-day {
    font-weight: 600;
  }
  .mm-picks {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .mm-pick {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
    padding: 4px 6px;
  }
  .mm-pick:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .mm-pick.on.p-y {
    background: var(--ok-soft);
    border-color: var(--ok);
    font-weight: 700;
  }
  .mm-pick.on.p-m {
    background: var(--warn-soft);
    border-color: var(--warn);
    font-weight: 700;
  }
  .mm-pick.on.p-n {
    background: var(--bad-soft);
    border-color: var(--bad);
    font-weight: 700;
  }
  .mm-err {
    margin: 0;
    color: var(--bad);
    font-weight: 600;
  }
  .mm-ok {
    margin: 0;
    font-weight: 600;
  }
  .mm-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
