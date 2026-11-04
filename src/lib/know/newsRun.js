/**
 * «Ausprobieren» (Noah 27.10.2026 «1a 2a 4a»): what a tap on a line of «What is new» does. The page opens,
 * windows and folds open, the spot glows 3 s and a short line says «New here: …». A thing without a fixed
 * place opens the page where it shows up and says when; «Show it in the example» starts the playground.
 */
import { goOf, hrefOf } from './newsgo.js';

export { tryOf } from './newsgo.js';
import { goFeature } from './featureRun.js';
import { showSteps, note } from './spot.js';
import { FEATURE } from '../features.js';
import { PLAY_WISH } from '../play.js';
import { openData } from '../nav.js';
import { t } from '../i18n.svelte.js';

/** The button «Show it in the example» for a day of the example trip, or null. */
const playGo = (day) =>
  day
    ? {
        label: t('Show it in the example'),
        run: () => {
          try {
            localStorage.setItem(PLAY_WISH, day);
          } catch {
            /* no storage: Me opens without the sheet */
          }
          if (location.hash.startsWith('#/me') && !location.hash.startsWith('#/me/')) window.dispatchEvent(new Event('pg:play'));
          else location.hash = '#/me';
        },
      }
    : null;

/**
 * A line that leads to a ride (go.ride === 'ghost', Noah 04.11.2026 «1a»): the card «Beat your ghost» sits inside one
 * ride, so «Try it» opens the newest bike ride that has an earlier ride to race against and lights the card. With no
 * such ride it opens Training and says in one line what a ride needs.
 */
async function goGhost(g, said, go) {
  const [{ db }, { ghostsOf }] = await Promise.all([import('../db.js'), import('../training/act/ghost.js')]);
  const all = await db.activities.toArray();
  const when = (a) => `${a.day} ${a.time ?? ''}`;
  const hit = all
    .filter((a) => a.kind === 'bike' && a.hrAvg > 0)
    .sort((a, b) => when(b).localeCompare(when(a)))
    .find((a) => ghostsOf(all, a, 1).length);
  if (!hit) {
    location.hash = g.href;
    return note(t(g.where), { go });
  }
  location.hash = `#/flow/training/a/${encodeURIComponent(hit.id)}`;
  return showSteps(g.steps, 'news', { note: said, miss: t(g.where), go });
}

/** Tap on a line p (a point or a small thing of a version). ev: the click, its link opens nothing itself. */
export function goNews(p, ev = null, { bikeId = null } = {}) {
  const g = goOf(p);
  if (!g) return;
  ev?.preventDefault();
  const said = t('New here: {what}', { what: t(g.note ?? p.text) });
  const go = playGo(g.play);
  if (g.action === 'data') return openData();
  if (g.feature) return goFeature(FEATURE[g.feature], { bikeId, spot: { note: said, miss: g.where ? t(g.where) : '', go } });
  if (g.ride === 'ghost') return goGhost(g, said, go);
  const href = hrefOf(g, { bikeId });
  if (href) {
    if (location.hash === href) window.dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = href;
  }
  if (g.steps?.length) return showSteps(g.steps, 'news', { note: said, miss: g.where ? t(g.where) : said, go });
  if (g.where) note(t(g.where), { go });
}
