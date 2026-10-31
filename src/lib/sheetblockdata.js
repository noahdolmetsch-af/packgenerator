/**
 * «Bausteine» (Noah 15.10.2026): what each building block of the Bike pass and the Workshop order
 * shows, from the data the app already has (see sheetblocks.js for the order and the switches).
 *
 * blockView(id, c) → { rows: [{ id, label, value, note, edit }], empty, summary } in the language of
 * the app; empty: nothing to show (the block is left out of the PDF and the text, B4 a).
 * shopLines(id, c) → the lines of the block in the German text to the bike shop.
 * orderMessage(…) → that text: the jobs, then the blocks in their order, then the km.
 *
 * c (the context of one bike): { bike (as stored), view (with the visits), sheet, data (sheets.js
 * sheetData), more (sheets2.js moreData), profile (workshop.js bikeProfile), tasks, visits, fields
 * (valuefields.js fieldsOf), pass (the sections of the Bike pass with their small lines), again,
 * keep, luggageG, today }.
 * Pure (apart from t), tested in tests/sheetblockdata.test.js.
 */
import { PART, isPrep, taskBike } from './care.js';
import { GEOMETRY, FIT_KEY, fitValue, specValue } from './bikespecs.js';
import { orderSum } from './workshop.js';
import { replacements, pickupChecked } from './abholwerte.js';
import { pressures, pressureLoss, chainState, WHEN } from './messen.js';
import { withUnit } from './sheets.js';
import { bikeBlocks, isOwn } from './sheetblocks.js';
import { bikesHash } from './bikes.js';
import { t, tn, num, dateOf, deTexts } from './i18n.svelte.js';

/** The German word of an English text (the bike shops speak German). */
const de = (en, vars) => {
  const s = deTexts()[en] ?? String(en).replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const deNum = (n) => Number(n).toLocaleString('de-CH');
const deDate = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('.') : '');
const deBar = (v) => String(v).replace('.', ',');
const filled = (v) => v != null && v !== '';
const partName = (k) => (PART[k] ? t(PART[k].name) : k);
const row = (id, label, value, note = '', edit = null) => ({ id, label, value: filled(value) ? String(value) : null, note, edit });

/** The built sections of the Bike pass that are blocks: block id → section key of sheets.js PASS. */
export const PASS_SECTION = { suspension: 'susp', wheels: 'wheels', fit: 'fit', drive: 'drive' };

/** The values the bike shop should leave as they are, without the ones of «As it should be again». */
export const keepRest = (keep, again) => keep.filter((r) => !again.some((a) => a.key === r.key));

/** The newest replacement of each part (newest first). */
function lastPerPart(view) {
  const seen = new Set();
  return replacements(view).filter((r) => !seen.has(r.key) && seen.add(r.key));
}

/** The problems noted on this bike since the last workshop visit (with the ones I fixed myself). */
export function problemsSince(c) {
  const last = (c.visits ?? []).filter((v) => v.bikeId === c.bike.id && v.date).map((v) => v.date).sort().at(-1) ?? null;
  return (c.tasks ?? [])
    .filter((x) => !isPrep(x) && taskBike(x) === c.bike.id && x.task && (!last || (x.logDate ?? '') > last))
    .sort((a, b) => (a.logDate ?? '').localeCompare(b.logDate ?? ''))
    .map((x) => ({ id: x.id, text: x.task, date: x.logDate ?? null, self: ['self', 'guide'].includes(x.fix), done: x.status === 'done' }));
}

/** The sizes a bike shop needs to order the right spare part. */
export function partSizes(view) {
  const wheel = specValue(view, 'wheelF', 'attrs.size');
  const wF = fitValue(view, 'tyreWidthF');
  const wR = fitValue(view, 'tyreWidthR');
  const width = filled(wF) && filled(wR) && String(wF) !== String(wR) ? `${wF} / ${wR}` : (wF ?? wR);
  const cogs = specValue(view, 'cassette', 'attrs.cogs');
  const pistons = specValue(view, 'brakeF', 'attrs.pistons');
  const rF = specValue(view, 'rotorF', 'attrs.dia');
  const rR = specValue(view, 'rotorR', 'attrs.dia');
  const frame = (view.parts ?? []).find((p) => p.key === 'frame');
  const udh = /\budh\b/i.test(`${frame?.model ?? ''} ${Object.values(frame?.attrs ?? {}).join(' ')}`);
  return [
    { id: 'tyres', label: 'Tyres', value: [wheel, width].filter(filled).join(' × ') || null },
    { id: 'chain', label: 'Chain', value: cogs ? t('{n}-speed', { n: String(cogs).replace(/\D+/g, '') || cogs }) : null, de: cogs ? `${String(cogs).replace(/\D+/g, '') || cogs}-fach` : null },
    { id: 'pads', label: 'Brake pads', value: pistons ? t('for {n}-piston', { n: String(pistons).replace(/\D+/g, '') || pistons }) : null, de: pistons ? `für ${String(pistons).replace(/\D+/g, '') || pistons}-Kolben` : null },
    { id: 'rotors', label: 'Rotors', value: filled(rF) || filled(rR) ? `${rF ?? '–'} / ${rR ?? '–'} mm` : null },
    { id: 'axles', label: 'Thru axles', value: specValue(view, 'axles', 'attrs.axle') },
    { id: 'hanger', label: 'Derailleur hanger', value: udh ? 'UDH' : null },
    { id: 'seatpost', label: 'Seatpost', value: filled(specValue(view, 'seatpost', 'attrs.dia')) ? `${specValue(view, 'seatpost', 'attrs.dia')} mm` : null },
  ].filter((r) => filled(r.value));
}

/** The pick-up wish suggested from the next trip: two days before it starts. */
export function pickupSuggestion(trip) {
  if (!trip?.startDate) return null;
  const d = new Date(Date.parse(`${trip.startDate}T00:00:00Z`) - 2 * 864e5).toISOString().slice(0, 10);
  return { date: d, text: t('at the latest 2 days before {trip}', { trip: trip.title }) };
}

/** The measured values: pressure, loss, chain, and on the Bike pass what was checked at the pick-up. */
function measured(c) {
  const out = [];
  const p = pressures(c.view).at(-1);
  if (p) {
    const when = WHEN.find((w) => w.key === p.when);
    out.push(row('pressure', t('Tyre pressure'), t('front {f} · rear {r} bar', { f: p.f == null ? '–' : num(p.f), r: p.r == null ? '–' : num(p.r) }), [dateOf(p.date), when ? t(when.name) : ''].filter(Boolean).join(', ')));
  }
  const loss = pressureLoss(c.view);
  if (loss) out.push({ ...row('loss', t('Pressure loss'), loss.wheel === 'f' ? t('front loses about {bar} bar a week', { bar: num(loss.perWeek) }) : t('rear loses about {bar} bar a week', { bar: num(loss.perWeek) })), tone: 'warn' });
  const ch = chainState(c.view);
  if (ch) {
    const last = c.view.parts?.find((x) => x.key === 'chain')?.history?.filter((h) => h.action === 'check' && typeof h.value === 'number').map((h) => h.date).sort().at(-1);
    // BS3 b: the forecast is on the Workshop order too
    const fore = ch.tone === 'worn' ? t('replace') : ch.left != null ? t('about {km} km left to {limit} %', { km: num(ch.left), limit: num(ch.limit) }) : '';
    out.push({ ...row('chain', t('Chain'), t('wear {value} %', { value: num(ch.value) }), [last ? dateOf(last) : '', fore].filter(Boolean).join(' · ')), tone: ch.tone === 'worn' ? 'bad' : ch.tone === 'warn' ? 'warn' : '' });
  }
  if (c.sheet === 'pass') {
    const chk = pickupChecked(c.bike);
    if (chk.date && chk.keys.length) out.push(row('checked', t('Checked at the pick-up'), chk.keys.map((k) => t(fitName(k))).join(', '), dateOf(chk.date)));
  }
  return out;
}
const fitName = (k) => FIT_KEY[k]?.name ?? k;

/** What one built block shows on this bike. */
export function blockView(id, c) {
  const rows = rowsOf(id, c);
  const empty = !rows.length;
  return { rows, empty, summary: summaryOf(id, rows, c) };
}

function rowsOf(id, c) {
  const { view } = c;
  if (PASS_SECTION[id]) return (c.pass ?? []).find((s) => s.key === PASS_SECTION[id])?.rows ?? [];
  if (id === 'measured') return measured(c);
  if (id === 'ownFields') {
    const enter = bikesHash({ tab: 'compare', view: 'enter', bike: c.bike.id });
    return (c.fields?.own ?? []).map((f) => row(`own:${f.id}`, f.name, withUnit(c.bike.ownValues?.[f.id], f.unit), '', enter));
  }
  if (id === 'geometry') return GEOMETRY.map((g) => row(g.key, t(g.name), withUnit(view.geometry?.[g.key], g.unit))).filter((r) => r.value != null);
  if (id === 'lastService') {
    const out = [];
    const l = c.profile?.last;
    if (l) out.push(row('visit', t('Bike shop|block'), [l.shop, dateOf(l.date)].filter(Boolean).join(' · '), [l.jobs ? tn(l.jobs, '{n} job', '{n} jobs') : '', l.chf != null ? `CHF ${num(Math.round(l.chf))}` : ''].filter(Boolean).join(' · ')));
    const own = (view.parts ?? []).flatMap((p) => (p.history ?? []).filter((h) => h.by === 'self' && h.date && h.action !== 'check').map((h) => ({ ...h, key: p.key }))).sort((a, b) => b.date.localeCompare(a.date))[0];
    if (own) out.push(row('self', t('My own work'), `${partName(own.key)} · ${dateOf(own.date)}`, typeof own.km === 'number' ? `${num(own.km)} km` : ''));
    return out;
  }
  if (id === 'warrantyShort') {
    const w = c.more?.warranty;
    if (!w?.bought) return [];
    return [row('bought', t('Bought'), dateOf(w.bought)), ...[...w.rows, ...w.replaced].map((r) => row(r.key, r.label, r.left < 0 ? t('ended') : t('until {date}', { date: dateOf(r.end) }), r.badge ?? ''))];
  }
  if (id === 'frameId') {
    const th = c.more?.theft;
    if (!th) return [];
    return [...th.id.filter((r) => r.id === 'frameNo' || r.id === 'colour'), ...th.marks.filter((r) => r.id === 'marks' || r.id === 'changes')].filter((r) => r.value != null).map((r) => row(r.id, r.label, r.value));
  }
  if (id === 'workshop') {
    const p = c.profile;
    const out = [];
    const shop = c.data?.order?.shop || p?.last?.shop;
    if (shop) out.push(row('shop', t('Bike shop|block'), shop));
    if (p?.year?.visits) out.push(row('year', t('This year'), [tn(p.year.visits, '{n} visit', '{n} visits'), p.year.chf ? `CHF ${num(Math.round(p.year.chf))}` : ''].filter(Boolean).join(' · ')));
    if (p?.per?.chf != null) out.push(row('per', t('Per 1000 km'), `CHF ${num(p.per.chf)}`));
    return out;
  }
  if (id === 'replaced') return lastPerPart(view).map((r) => row(r.key, r.name, dateOf(r.date), [r.km != null ? `${num(r.km)} km` : '', r.before != null ? t('the one before rode {km} km', { km: num(r.before) }) : '', r.by === 'shop' ? t('Bike shop|block') : ''].filter(Boolean).join(' · ')));
  if (id === 'nextDue') return (c.profile?.next ?? []).map((n, i) => ({ ...row(`n${i}`, n.name, n.detail), tone: n.late ? 'warn' : '' }));
  // Workshop order
  if (id === 'jobs') return (c.data?.picked ?? []).map((r) => row(r.key, r.name, r.chf == null ? null : `CHF ${Math.round(r.chf)}`, r.detail));
  if (id === 'again') return (c.again ?? []).map((r) => row(r.key, r.label, r.value));
  if (id === 'keep') return keepRest(c.keep ?? [], c.again ?? []).map((r) => row(r.key, r.label, r.value));
  if (id === 'budget') {
    const { total, unknown } = orderSum(c.data?.picked ?? []);
    const limit = bikeBlocks(c.bike).data.budget?.limit ?? null;
    const out = [];
    if (total) out.push(row('estimate', t('Estimate from my receipts'), `CHF ${num(total)}${unknown ? ` ${t('plus material')}` : ''}`));
    if (typeof limit === 'number' && limit > 0) out.push(row('limit', t('Please call above'), `CHF ${num(limit)}`));
    return out;
  }
  if (id === 'wishes') {
    const w = String(c.bike.sheets?.wishes ?? '').trim();
    return w ? [row('wishes', w, '')] : [];
  }
  if (id === 'problems') return problemsSince(c).map((p) => row(p.id, p.text, p.date ? dateOf(p.date) : '', p.self ? t('fixed it myself') : ''));
  if (id === 'pickupWish') {
    const w = bikeBlocks(c.bike).data.pickupWish ?? {};
    return w.date || String(w.text ?? '').trim() ? [row('wish', t('Back by'), [w.date ? dateOf(w.date) : '', String(w.text ?? '').trim()].filter(Boolean).join(', '))] : [];
  }
  if (id === 'nextTrip') {
    const tr = c.data?.trip;
    if (!tr) return [];
    const out = [row('trip', tr.title, [tr.startDate ? dateOf(tr.startDate) : '', tr.days ? tn(Number(tr.days), '{n} day', '{n} days') : ''].filter(Boolean).join(' · '))];
    if (c.luggageG) out.push(row('luggage', t('Luggage'), t('about {kg} kg', { kg: num(Math.round(c.luggageG / 1000)) })));
    return out;
  }
  if (id === 'partsBrought') return (bikeBlocks(c.bike).data.partsBrought ?? []).filter((p) => p && String(p.text ?? '').trim()).map((p) => row(p.id, String(p.text).trim(), ''));
  if (id === 'partSizes') return partSizes(view).map((r) => row(r.id, t(r.label), r.value));
  return [];
}

function summaryOf(id, rows, c) {
  if (id === 'jobs') return rows.length ? rows.map((r) => r.label).slice(0, 3).join(' · ') : t('Nothing for the bike shop right now.');
  if (!rows.length) return t(EMPTY[id] ?? 'Nothing to show for this bike yet.', { date: '' });
  const bits = rows.slice(0, 3).map((r) => (r.value ? `${r.label} ${r.value}` : r.label));
  const more = rows.length > 3 ? ` · ${tn(rows.length - 3, '{n} more', '{n} more')}` : '';
  return `${bits.join(' · ')}${more}`;
}

/** What a block says when it has nothing on this bike (on the sheet only while arranging). */
export const EMPTY = {
  suspension: 'No suspension on this bike.',
  measured: 'Nothing measured yet. Measure the pressure or the chain in Care.',
  ownFields: 'No own fields yet. Add one under Enter values › Choose fields.',
  geometry: 'No geometry yet. It comes with the spec import or under Compare bikes.',
  lastService: 'No service recorded yet.',
  warrantyShort: 'No purchase date. Enter it under Warranty & receipts.',
  frameId: 'No frame number yet. Enter it on the Theft sheet.',
  workshop: 'No workshop visit yet.',
  replaced: 'No part replaced since the purchase.',
  nextDue: 'Nothing due soon.',
  again: 'After the first pick-up check, its values show here.',
  budget: 'No price from your receipts yet. You can set a limit.',
  keep: 'No values to keep yet.',
  wishes: 'No wishes yet.',
  problems: 'No problem noted since the last visit.',
  pickupWish: 'When do you need it back?',
  nextTrip: 'No trip planned on this bike.',
  partsBrought: 'Bringing a part? Add it so the shop knows.',
  partSizes: 'No sizes known yet.',
};

/* ---------- own blocks ---------- */

/** What an own block shows on this bike: { rows, empty, summary }. kind text: one row with the text. */
export function ownView(def, bike) {
  const c = bikeBlocks(bike).own[def.ownId ?? def.id] ?? {};
  if (def.kind === 'text') {
    const text = typeof c.text === 'string' ? c.text : def.std ?? '';
    const rows = text.trim() ? [row('text', text.trim(), '')] : [];
    return { rows, empty: !rows.length, summary: text.trim() ? text.trim().split('\n')[0].slice(0, 90) : t('No text for this bike yet. Tap to write one.') };
  }
  if (def.kind === 'check') {
    const rows = def.points.map((p) => ({ ...row(p.id, p.text, ''), ticked: !!c.ticks?.[p.id] }));
    return { rows, empty: !rows.length, summary: rows.length ? rows.map((r) => r.label).slice(0, 3).join(' · ') : t('No points yet. Add one.') };
  }
  const rows = def.labels.map((l) => row(l.id, l.text, withUnit(c.values?.[l.id], l.unit)));
  const any = rows.some((r) => r.value != null);
  return { rows, empty: !any, summary: any ? rows.filter((r) => r.value != null).slice(0, 3).map((r) => `${r.label} ${r.value}`).join(' · ') : t('No values for this bike yet.') };
}

/* ---------- the text to the bike shop (German) ---------- */

/** The lines of one block in the German text to the bike shop ([] when it has nothing). */
export function shopLines(id, c, def = null) {
  if (isOwn(id)) {
    if (!def || def.toShop === false) return [];
    const v = ownView(def, c.bike);
    if (v.empty) return [];
    if (def.kind === 'text') return [`${def.title}: ${v.rows[0].label}`];
    if (def.kind === 'check') return [`${def.title}:`, ...v.rows.map((r) => `- ${r.label}`)];
    return [`${def.title}: ${v.rows.filter((r) => r.value != null).map((r) => `${r.label} ${r.value}`).join(', ')}`];
  }
  const v = c.view;
  const list = (rs) => rs.map((r) => `${r.de ?? r.label} ${r.value}`).join(', ');
  if (id === 'again') return c.again?.length ? [`So soll es wieder sein${pickupChecked(c.bike).date ? ` (Abholen ${deDate(pickupChecked(c.bike).date)})` : ''}: ${list(c.again)}`] : [];
  if (id === 'keep') {
    const rest = keepRest(c.keep ?? [], c.again ?? []);
    return rest.length ? [`Bitte so lassen: ${list(rest)}`] : [];
  }
  if (id === 'budget') {
    const { total, unknown } = orderSum(c.data?.picked ?? []);
    const limit = bikeBlocks(c.bike).data.budget?.limit ?? null;
    const out = [];
    if (total) out.push(`Nach meinen letzten Quittungen rechne ich mit etwa CHF ${total}${unknown ? ' plus Material' : ''}.`);
    if (typeof limit === 'number' && limit > 0) out.push(`Bitte rufen Sie mich an, bevor es mehr als CHF ${deNum(limit)} kostet.`);
    return out;
  }
  if (id === 'measured') {
    const out = [];
    const ch = chainState(v);
    if (ch) {
      const last = v.parts?.find((x) => x.key === 'chain')?.history?.filter((h) => h.action === 'check' && typeof h.value === 'number').map((h) => h.date).sort().at(-1);
      const fore = ch.tone === 'worn' ? ', ersetzen' : ch.left != null ? `, noch ca. ${deNum(ch.left)} km bis ${deBar(ch.limit)} %` : '';
      out.push(`Kettenverschleiss ${deBar(ch.value)} %${last ? ` (${deDate(last)})` : ''}${fore}`);
    }
    const p = pressures(v).at(-1);
    if (p) out.push(`Reifendruck vorne ${p.f == null ? '–' : deBar(p.f)}, hinten ${p.r == null ? '–' : deBar(p.r)} bar (${deDate(p.date)})`);
    const loss = pressureLoss(v);
    if (loss) out.push(`${loss.wheel === 'f' ? 'Vorderrad' : 'Hinterrad'} verliert ca. ${deBar(loss.perWeek)} bar pro Woche`);
    return out.length ? [`Zuletzt gemessen: ${out.join(', ')}`] : [];
  }
  if (id === 'wishes') {
    const w = String(c.bike.sheets?.wishes ?? '').trim();
    return w ? [`Wünsche: ${w}`] : [];
  }
  if (id === 'problems') {
    const ps = problemsSince(c);
    return ps.length ? ['Probleme seit dem letzten Besuch:', ...ps.map((p) => `- ${p.text}${p.date ? ` (${deDate(p.date)})` : ''}${p.self ? ', selbst behoben' : ''}`)] : [];
  }
  if (id === 'pickupWish') {
    const w = bikeBlocks(c.bike).data.pickupWish ?? {};
    const text = String(w.text ?? '').trim();
    return w.date || text ? [`Abholen: ${[w.date ? `bis ${deDate(w.date)}` : '', text].filter(Boolean).join(', ')}`] : [];
  }
  if (id === 'nextTrip') {
    const tr = c.data?.trip;
    if (!tr) return [];
    const bits = [tr.startDate ? `ab ${deDate(tr.startDate)}` : '', tr.days ? `${tr.days} ${Number(tr.days) === 1 ? 'Tag' : 'Tage'}` : '', c.luggageG ? `mit ca. ${deNum(Math.round(c.luggageG / 1000))} kg Gepäck` : ''].filter(Boolean);
    return [`Nächste Tour: ${tr.title}${bits.length ? `, ${bits.join(', ')}` : ''}`];
  }
  if (id === 'partsBrought') {
    const ps = (bikeBlocks(c.bike).data.partsBrought ?? []).map((p) => String(p?.text ?? '').trim()).filter(Boolean);
    return ps.length ? [`Ich bringe mit: ${ps.join(', ')}`] : [];
  }
  if (id === 'partSizes') {
    const ps = partSizes(v);
    return ps.length ? [`Masse: ${ps.map((r) => `${de(r.label)} ${r.de ?? r.value}`).join(', ')}`] : [];
  }
  if (id === 'replaced') {
    const rs = lastPerPart(v);
    return rs.length ? [`Getauschte Teile: ${rs.map((r) => `${PART[r.key] ? de(PART[r.key].name) : r.key} ${deDate(r.date)}${r.km != null ? ` bei ${deNum(r.km)} km` : ''}`).join(', ')}`] : [];
  }
  return [];
}

/**
 * The text of the Workshop order for the bike shop: «Grüezi», the jobs (when the block «Please do» is
 * on), then the blocks in their order, the km, «Wann hätten Sie Zeit?». shown: the ids of the blocks
 * that are on, in their order; defs: the own blocks by id (own:<id>).
 */
export function orderMessage(c, shown, defs = {}) {
  const rows = c.data?.picked ?? [];
  const bike = c.view;
  const trip = c.data?.trip ?? null;
  const jobs = shown.includes('jobs') && rows.length;
  const intro = trip?.startDate ? `Ich möchte mein ${bike.name} vor dem ${deDate(trip.startDate)} (${trip.title}) in den Service bringen.` : `Ich möchte mein ${bike.name} in den Service bringen.`;
  const lines = ['Grüezi', '', jobs ? `${intro} Bitte:` : intro];
  if (jobs) lines.push(...rows.map((r) => `- ${r.de}`));
  const extra = shown.filter((id) => id !== 'jobs').flatMap((id) => shopLines(id, c, defs[id] ?? null));
  if (typeof bike?.km === 'number') extra.push(`Kilometerstand: ${deNum(bike.km)} km`);
  if (extra.length) lines.push('', ...extra);
  lines.push('', 'Wann hätten Sie Zeit?', '', 'Freundliche Grüsse');
  return lines.join('\n');
}
