<script>
  /**
   * Paket C › Dein späteres Ich (#/me/ruhig/spaeter; 996 Ideen UC-153-I1, UC-153-I3, UC-159-I2):
   * «Brief für einen Moment», «Alten Briefen antworten», «Später anders gesehen». Logic: spaeter.js.
   * The voice letters (Klangbrief, UC-231-I3) are a part of this page too (Klangbrief.svelte).
   */
  import { liveQuery } from 'dexie';
  import { Mail, Mic, MailOpen, Reply, CalendarClock, Trash2 } from '@lucide/svelte';
  import Card from './Card.svelte';
  import Klangbrief from './Klangbrief.svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { settingQ, saveSetting } from './store.js';
  import { openFromHash } from './open.js';
  import { dmy, addDays } from './base.js';
  import { LETTERS_KEY, LATER_KEY, WHEN, DAY_QUESTION, lettersOf, newLetter, momentOf, dueLetters, openLetter, replyLetter, storyOf, laterOf, setLater, ratedDays } from './spaeter.js';

  const today = localDay();
  const first = openFromHash();
  let open = $state({ letters: first === 'letters' || !first, reply: first === 'reply', later: first === 'later', sound: first === 'sound' });

  const lettersQ = settingQ(LETTERS_KEY);
  const laterQ = settingQ(LATER_KEY);
  const ctxQ = liveQuery(async () => {
    const [trips, km, rows] = await Promise.all([db.trips.toArray(), db.kmBook.toArray(), db.abAnswers.where('qid').equals(DAY_QUESTION).toArray().catch(() => [])]);
    const rideDays = [...new Set(km.filter((e) => e?.date && e.kind === 'ride' && e.state !== 'removed' && Number(e.km) > 0).map((e) => String(e.date).slice(0, 10)))].sort();
    return { trips, rideDays, rows };
  });
  const letters = $derived(lettersOf($lettersQ));
  const later = $derived(laterOf($laterQ));
  const ctx = $derived({ trips: $ctxQ?.trips ?? [], rideDays: $ctxQ?.rideDays ?? [], today });
  const due = $derived(dueLetters(letters, ctx));
  const dueIds = $derived(new Set(due.map((l) => l.id)));
  const closed = $derived(letters.filter((l) => !l.opened && !dueIds.has(l.id)));
  const opened = $derived(letters.filter((l) => l.opened).sort((a, b) => b.opened.localeCompare(a.opened)));
  const saveLetters = (list) => saveSetting(LETTERS_KEY, list);
  const whenOf = (k) => WHEN.find((w) => w.key === k);
  const waitText = (l) => {
    const at = momentOf(l, ctx);
    return l.when.kind === 'date' ? t('opens on {day}', { day: dmy(l.when.day) }) : at ? t('opens on {day} ({moment})', { day: dmy(at), moment: t(whenOf(l.when.kind).short) }) : t('waits for: {moment}', { moment: t(whenOf(l.when.kind).short) });
  };

  /* write */
  let text = $state('');
  let kind = $state('firstnight');
  let day = $state(addDays(today, 30));
  let prev = $state(null);
  function write(e) {
    e.preventDefault();
    const l = newLetter({ text, kind, day, prev }, today);
    if (!l) return;
    saveLetters([...letters, l]);
    text = '';
    prev = null;
  }
  async function remove(l) {
    const ok = await askDelete({ title: t('Delete this letter?'), text: t('The letter and its answer go.') });
    if (ok !== 'delete') return;
    const before = letters;
    await deleteWithUndo({ run: () => saveLetters(letters.filter((x) => x.id !== l.id)).then(() => before), undo: (s) => saveLetters(s), text: t('Letter deleted.'), name: t('Letter') });
  }
  let answer = $state({});
  function continueStory(l) {
    prev = l.id;
    open.letters = true;
    text = '';
    document.querySelector('[data-letter-text]')?.focus();
  }

  /* later view */
  const days = $derived(ratedDays($ctxQ?.rows ?? [], later, today, 30));
  let lt = $state({});
  let lv = $state({});
  const saveLater = (d) => saveSetting(LATER_KEY, setLater(later, d, { text: lt[d] ?? later[d]?.text ?? '', v: lv[d] ?? later[d]?.v ?? null }, today));
</script>

<ul class="rh-cards">
  <Card id="letters" icon={Mail} title={t('Letter for a moment')} lead={t('A letter to yourself that opens in a moment you choose')} bind:open={open.letters}>
    {#each due as l (l.id)}
      <div class="rh-note rh-due" data-letter-due={l.id}>
        <b>{t('A letter from {day} is waiting for you', { day: dmy(l.written) })}</b>
        <button type="button" class="btn hi sm" onclick={() => saveLetters(openLetter(letters, l.id, today))} data-letter-open><MailOpen size={16} aria-hidden="true" />{t('Open the letter')}</button>
      </div>
    {/each}
    <form class="rh-new" onsubmit={write}>
      {#if prev}<p class="rh-note">{t('This letter goes on from the one of {day}.', { day: dmy(letters.find((x) => x.id === prev)?.written) })} <button type="button" class="btn-link btn sm" onclick={() => (prev = null)}>{t('Start a new story')}</button></p>{/if}
      <label class="rh-field"><span>{t('When should it open?')}</span>
        <select class="inp" bind:value={kind} data-letter-when>{#each WHEN as w (w.key)}<option value={w.key}>{t(w.label)}</option>{/each}</select>
      </label>
      {#if kind === 'date'}<label class="rh-field"><span>{t('Date')}</span><input class="inp" type="date" min={addDays(today, 1)} bind:value={day} /></label>{/if}
      <label class="rh-field"><span>{t('Your letter')}</span><textarea class="inp" rows="4" bind:value={text} placeholder={t('e.g. Remember: the first night is always loud. Sleep comes.')} data-letter-text></textarea></label>
      <button type="submit" class="btn hi" disabled={!text.trim()} data-letter-add><CalendarClock size={16} aria-hidden="true" />{t('Close the letter')}</button>
    </form>
    {#if closed.length}
      <p class="rh-sub">{t('Closed letters')}</p>
      <ul class="rh-list" data-letters-closed>
        {#each closed as l (l.id)}
          <li><Mail size={16} aria-hidden="true" /><span class="rh-grow">{t('Written on {day}', { day: dmy(l.written) })}<small>{waitText(l)}</small></span><button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => remove(l)}><Trash2 size={16} /></button></li>
        {/each}
      </ul>
    {/if}
  </Card>

  <Card id="reply" icon={Reply} title={t('Answer your old letters')} lead={t('Your later self answers; the letters become one story over several trips')} bind:open={open.reply}>
    {#if opened.length}
      {#each opened as l (l.id)}
        {@const story = storyOf(letters, l.id)}
        <div class="rh-letter" data-letter={l.id}>
          {#if story.length > 1}<p class="rh-help">{t('Part {n} of a story', { n: story.length })}</p>{/if}
          <p class="rh-help">{t('Written on {day}, opened on {open}', { day: dmy(l.written), open: dmy(l.opened) })}</p>
          <p class="rh-ltext">{l.text}</p>
          {#if l.reply}
            <p class="rh-reply"><b>{t('Your answer on {day}', { day: dmy(l.reply.day) })}</b><br />{l.reply.text}</p>
          {:else}
            <textarea class="inp" rows="2" bind:value={answer[l.id]} placeholder={t('What would you answer today?')} aria-label={t('Your answer')} data-letter-reply></textarea>
          {/if}
          <div class="rh-row">
            {#if !l.reply}<button type="button" class="btn sm" disabled={!(answer[l.id] ?? '').trim()} onclick={() => saveLetters(replyLetter(letters, l.id, answer[l.id], today))}>{t('Keep the answer')}</button>{/if}
            <button type="button" class="btn sm btn-link" onclick={() => continueStory(l)}>{t('Write the next letter')}</button>
            <button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => remove(l)}><Trash2 size={16} /></button>
          </div>
        </div>
      {/each}
    {:else}<p class="rh-empty">{t('No letter opened yet. Once a letter opens, you can answer it here.')}</p>{/if}
  </Card>

  <Card id="later" icon={CalendarClock} title={t('Seen differently later')} lead={t('Next to how you rated a day back then, how you see it now')} bind:open={open.later}>
    <p class="rh-help">{t('Your answer of that evening stays as it was. The later view stands next to it.')}</p>
    {#if days.length}
      <ul class="rh-list" data-later-days>
        {#each days as d (d.day)}
          <li class="rh-lday">
            <span class="rh-grow">
              <b>{dmy(d.day)}</b> · {t('back then {v} of 10', { v: d.then })}{#if d.note}<small>«{d.note}»</small>{/if}
              {#if d.later}<small class="rh-lnow">{t('Later ({day})', { day: dmy(d.later.at) })}{#if d.later.v}: {d.later.v}/10{/if}{#if d.later.text} · {d.later.text}{/if}</small>{/if}
              <span class="rh-row rh-ledit">
                <input class="inp" value={lt[d.day] ?? d.later?.text ?? ''} oninput={(e) => (lt[d.day] = e.currentTarget.value)} placeholder={t('How do you see the day today?')} aria-label={t('Later view of {day}', { day: dmy(d.day) })} />
                <select class="inp rh-v" value={lv[d.day] ?? d.later?.v ?? ''} onchange={(e) => (lv[d.day] = e.currentTarget.value ? Number(e.currentTarget.value) : null)} aria-label={t('New value')}><option value="">–</option>{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as v (v)}<option value={v}>{v}</option>{/each}</select>
                <button type="button" class="btn sm" onclick={() => saveLater(d.day)}>{t('Keep')}</button>
              </span>
            </span>
          </li>
        {/each}
      </ul>
    {:else}<p class="rh-empty">{t('No rated day yet. In the evening check, «How happy are you with the day?» gives the value of a day.')}</p>{/if}
  </Card>

  <Card id="sound" icon={Mic} title={t('Voice letters')} lead={t('Short thoughts of up to 1 minute, to listen to later')} bind:open={open.sound}>
    <Klangbrief />
  </Card>
</ul>

<style>
  .rh-new {
    display: grid;
    gap: var(--sp-3);
  }
  .rh-due {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    background: var(--accent-soft);
    color: var(--ink);
  }
  .rh-letter {
    display: grid;
    gap: 6px;
    padding: var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
  }
  .rh-ltext,
  .rh-reply {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  .rh-reply {
    padding-left: 10px;
    border-left: 3px solid var(--accent);
  }
  .rh-lday .rh-grow {
    display: grid;
    gap: 4px;
  }
  .rh-lnow {
    color: var(--ink) !important;
  }
  .rh-ledit {
    flex-wrap: nowrap;
  }
  .rh-v {
    width: 64px;
    flex: none !important;
  }
</style>
