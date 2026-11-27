/**
 * «Ideen» (Auswerten › Ideen, «Für deine Balance»; Noah 27.11.2026 «ich kann nicht mehr ideen laden. bitte verbessern»):
 * every area has several tips instead of one, so «I like it» and «Another idea» always bring the next one. The first
 * tip of an area is the one of balance.js (CATS); the others are listed here. Texts are English keys for t().
 */
import { CATS } from './balance.js';

const MORE = {
  fun: ['A game evening with friends or family?', 'Try one new thing today, however small?', 'Put on your favourite music and dance for one song?', 'Cook something you have never cooked before?', 'A small surprise for someone?'],
  rest: ['An hour without screens before bed?', 'Go to bed half an hour earlier tonight?', 'A slow walk without a goal?', 'A warm bath or a hot tea in peace?', 'One easy day with nothing planned?'],
  sport: ['A short stretching round in the evening?', 'Take the stairs and walk the short ways today?', 'A longer ride at the weekend?', 'Twenty minutes of strength exercises at home?', 'An easy run or a brisk walk?'],
  mind: ['Three slow breaths before the next task?', 'Eat one meal without your phone?', 'Write down three things that went well today?', 'Five minutes of sitting still and listening?', 'A short body scan before sleep?'],
  friends: ['Call someone you have not talked to for a while?', 'A coffee with a friend this week?', 'Send a short message to say thank you?', 'Plan a walk together?', 'Invite someone for dinner?'],
  nature: ['Have your lunch outside?', 'A walk in the woods or by the water?', 'Watch the sunset or the sunrise?', 'Take a different way through green places?', 'A ride on a quiet gravel road?'],
  vision: ['Write one sentence about where you want to be in a year?', 'Look at your vision and pick one small step?', 'Imagine a good ordinary day in your vision?', 'Is there something you want to stop, to make room?', 'Talk about your vision with someone you trust?'],
  goals: ['Write the three most important things for tomorrow?', 'Split one big goal into a first small step?', 'Choose one goal for this week?', 'Look at your goals and drop one that no longer fits?', 'Plan the first ten minutes of tomorrow?'],
  done: ['Finish one small thing you have been putting off?', 'Tick off something you did that nobody saw?', 'Clear one corner of your desk or bag?', 'Look back: what did you manage this week?', 'Reward yourself for something finished?'],
};

/** All tips of an area, the one of balance.js first. */
export const TIPS = Object.fromEntries(CATS.map((c) => [c.key, [c.tip, ...(MORE[c.key] ?? [])]]));

/** The tip index of every area is kept here (settings), so the next idea stays after a reload. */
export const TIP_IX_KEY = 'ideas.tipIx';

/**
 * The tip to show for an area: the first one from the stored place on (round the list) that is not yet among your
 * ideas. tr: the translation (taken holds the texts of your ideas in the language of the app).
 * Returns { key, ix, n } or null when all tips of the area are in your ideas.
 */
export function pickTip(tips = [], ix = 0, taken = new Set(), tr = (x) => x) {
  const n = tips.length;
  for (let i = 0; i < n; i++) {
    const at = (((ix ?? 0) + i) % n + n) % n;
    if (!taken.has(tr(tips[at]))) return { key: tips[at], ix: at, n };
  }
  return null;
}

/** The place after the shown tip (for «I like it» and «Another idea»). */
export const nextIx = (tips = [], ix = 0) => (tips.length ? (ix + 1) % tips.length : 0);
