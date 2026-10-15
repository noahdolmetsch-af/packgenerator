<script>
  /**
   * v0.102.0 «Vorschlag und Challenge» on Heute (D1b, Noah «d1-d5 freigeben», 12.10.2026: «Heute baden
   * oder Sauna?» always, with alternatives, and any of them as a challenge). Reads and writes the
   * records of lib/challenge.js (settings, they travel in the backup); a challenge reached is marked
   * at once and celebrated on the tile and under «Important today».
   */
  import { Waves } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import SuggestTile from '../ui/SuggestTile.svelte';
  import ChallengeSheet from '../ui/ChallengeSheet.svelte';
  import { CHALLENGES_KEY, suggestKey, suggestOf, pickOption, addOption, toggleTick, tickedToday, challengesOf, newChallenge, countOf, activeFor, stepChallenges, freshDone, monthEnd } from '../challenge.js';
  import { t } from '../i18n.svelte.js';

  let { today } = $props();
  const KEY = suggestKey('today');
  const q = liveQuery(async () => {
    const [s, c] = await Promise.all([db.settings.get(KEY), db.settings.get(CHALLENGES_KEY)]);
    return { s: suggestOf(s?.value), list: challengesOf(c?.value) };
  });
  const s = $derived($q?.s ?? suggestOf(null));
  const list = $derived($q?.list ?? []);
  // the alternatives of the start are English keys (t), own ones stay as typed
  const label = (x) => t(x);
  const done = $derived(!!s.pick && tickedToday(s, s.pick, today));
  const running = $derived(s.pick ? activeFor(list, s.pick, today) : null);
  const challenge = $derived(running ? { ...running, n: countOf(running, s) } : null);
  const reached = $derived(freshDone(list, today).find((c) => c.area === 'today' && c.what === s.pick) ?? null);
  let sheet = $state(false);

  const saveS = (next) => putSetting(db, KEY, next);
  // Fix 14.10.: a quick second tap read the old record (the tile shows the saved one a moment later) and
  // ticked again; now a tap waits for the one before and toggles what is saved
  let ticking = false;
  async function tick() {
    if (ticking) return;
    ticking = true;
    try {
      const cur = suggestOf((await db.settings.get(KEY))?.value);
      const next = toggleTick(cur, s.pick, today);
      await saveS(next);
      const r = stepChallenges(list, { today: next }, today);
      if (r.reached.length) await putSetting(db, CHALLENGES_KEY, r.list);
    } finally {
      ticking = false;
    }
  }
  async function saveChallenge({ times, until }) {
    const next = running ? list.map((c) => (c.id === running.id ? { ...c, times, until } : c)) : [...list, newChallenge({ what: s.pick, times, until, today })];
    await putSetting(db, CHALLENGES_KEY, stepChallenges(next, { today: s }, today).list);
  }
  const stop = () => putSetting(db, CHALLENGES_KEY, list.map((c) => (c.id === running?.id ? { ...c, stopped: true } : c)));
</script>

<SuggestTile icon={Waves} id="sg-today" title={t('Swim or sauna today?')} options={s.options} pick={s.pick} {done} {label} {challenge} {reached} onpick={(o) => saveS(pickOption(s, o))} onadd={(o) => saveS(addOption(s, o))} ontick={tick} onchallenge={() => (sheet = true)} />
<ChallengeSheet bind:open={sheet} what={s.pick ? label(s.pick) : ''} times={running?.times ?? 10} until={running?.until ?? monthEnd(today)} min={today} running={!!running} onsave={saveChallenge} onstop={stop} />
