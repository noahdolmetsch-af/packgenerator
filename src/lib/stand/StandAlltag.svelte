<script>
  /**
   * «Dein Stand in Zahlen» on Alltag (Noah 25.11.2026, after Velos und Material): the days in a row outdoors (the challenge
   * «Draussen», the same count as the card on Heute), the open points of the shopping list and the days to the next last day to
   * cancel a contract (never an amount), and the minutes outdoors of the last 14 days below (the shared bar chart). Reads what
   * is already there; the pattern is the one of StandVelos (src/lib/ui/StandZahlen.svelte, docs/decisions/stand-in-zahlen.md).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import StandZahlen from '../ui/StandZahlen.svelte';
  import MonthBars from '../review/MonthBars.svelte';
  import { MINUTE_STEPS } from '../charts/axis.js';
  import { alltagQuery } from '../alltagdb.js';
  import { ALLTAG_HASH } from '../alltag.js';
  import { OUTDOOR_KEY, outdoorOf } from '../outdoor.js';
  import { localDay } from '../localday.js';
  import { alltagStand } from './alltag.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  const today = localDay();
  const baseQ = alltagQuery(db);
  const outQ = liveQuery(async () => {
    const rec = outdoorOf((await db.settings.get(OUTDOOR_KEY))?.value);
    const acts = rec?.from ? await db.activities.where('day').between(rec.from, rec.until, true, true).toArray() : [];
    return { rec, acts };
  });
  const loaded = $derived($baseQ !== undefined && $outQ !== undefined);
  const s = $derived(loaded ? alltagStand({ rec: $outQ.rec, activities: $outQ.acts, shop: $baseQ.shop, contracts: $baseQ.contracts, today }) : null);

  const dayLong = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'long' });
  const dayShort = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'numeric' });
  const tiles = $derived.by(() => {
    if (!s) return [];
    const first = s.running
      ? { value: num(s.streak), unit: tn(s.streak, 'day|stand', 'days|stand'), label: t('in a row outdoors'), href: '#/flow/challenges', tone: s.streak ? 'good' : '' }
      : { value: '–', label: t('no outdoor challenge running'), href: '#/flow/challenges' };
    const second = { value: num(s.shop), label: s.shop === 0 ? t('shopping list is empty') : t('open on the shopping list'), href: `${ALLTAG_HASH}/einkauf` };
    const third =
      s.deadline == null
        ? { value: '–', label: t('no deadline ahead'), href: `${ALLTAG_HASH}/abos` }
        : s.deadline === 0
          ? { value: t('today'), label: t('next deadline'), href: `${ALLTAG_HASH}/abos`, tone: 'warn' }
          : { value: num(s.deadline), unit: tn(s.deadline, 'day|stand', 'days|stand'), label: t('to the next deadline'), href: `${ALLTAG_HASH}/abos`, tone: s.deadline <= 30 ? 'warn' : '' };
    return [first, second, third];
  });
  const cols = $derived(
    (s?.days ?? []).map((d, i, all) => ({
      key: d.day,
      title: dayLong(d.day),
      x: i % 2 === (all.length - 1) % 2 ? dayShort(d.day) : '',
      top: '',
      parts: [{ v: d.min }],
      items: [{ label: t('Minutes outdoors'), value: num(d.min) }],
    })),
  );
</script>

{#if loaded}
  {#if s.days.length}
    <StandZahlen area="alltag" name={t('Everyday life')} {tiles} chartLabel={t('Minutes outdoors per day, the last 14 days')}>
      <MonthBars {cols} mark={today} first={t('Day')} unit="min" steps={MINUTE_STEPS} id="stand-alltag" label={t('Minutes outdoors per day, the last 14 days')} height={90} />
    </StandZahlen>
  {:else}
    <StandZahlen area="alltag" name={t('Everyday life')} {tiles} foot={t('No outdoor challenge is running. You can start «Outdoors» on Today or under Challenges.')} />
  {/if}
{/if}
