/**
 * «Werkzeug passend zum Velo» (Ziel 6, Noah 27.10.2026, idea 7 of the ultra analysis): the tools and spares
 * for this race, made from the race's bike: tubeless or tubes, the chain's speeds, the brake pads, a
 * suspension. Your own list per race (stored.tools = [{ id, text, why, done }]); until you change
 * something the suggestions show (English keys for t()). No imports, so e2e specs can read it.
 * Tested in tests/race-tools.test.js.
 */

const part = (bike, key) => (bike?.parts ?? []).find((p) => p.key === key) ?? null;
const known = (p) => !!(p && (String(p.model ?? '').trim() || (p.history ?? []).length));

/**
 * The suggestions for one bike. tyres: { front, rear } with 'tubeless' | 'tube' | null.
 * → [{ id, text, why, vars }] (text and why are English keys, vars fill them).
 */
export function suggestTools(bike = null, tyres = { front: null, rear: null }) {
  const tubeless = tyres?.front === 'tubeless' || tyres?.rear === 'tubeless';
  const tubes = tyres?.front === 'tube' || tyres?.rear === 'tube';
  const out = [
    { id: 'tl-multi', text: 'Multitool with chain tool', why: 'Always along' },
    { id: 'tl-levers', text: 'Tyre levers', why: 'Always along' },
    { id: 'tl-pump', text: 'Mini pump or CO₂', why: 'Always along' },
  ];
  if (tubeless) {
    out.push(
      { id: 'tl-plugs', text: 'Tubeless plugs', why: 'Your tyres are tubeless' },
      { id: 'tl-sealant', text: 'Small bottle of sealant', why: 'Your tyres are tubeless' },
      { id: 'tl-valve', text: 'Valve core tool and a spare valve', why: 'Your tyres are tubeless' },
      { id: 'tl-tube1', text: 'One spare tube as a backup', why: 'When a plug does not hold' },
    );
  }
  if (tubes || !tubeless) {
    out.push(
      { id: 'tl-tubes', text: 'Two spare tubes', why: tubes ? 'Your tyres have tubes' : 'Tubeless or tubes is not set for this bike' },
      { id: 'tl-patches', text: 'Patch kit', why: tubes ? 'Your tyres have tubes' : 'Tubeless or tubes is not set for this bike' },
    );
  }
  const cogs = String(part(bike, 'cassette')?.attrs?.cogs ?? '').replace(/\D+/g, '');
  out.push(cogs ? { id: 'tl-link', text: 'Quick link for {n}-speed', vars: { n: cogs }, why: 'Your cassette' } : { id: 'tl-link', text: 'Chain quick link (the right speed)', why: 'The number of cogs is not set for this bike' });
  out.push({ id: 'tl-oil', text: 'Small bottle of chain oil', why: 'For long days and rain' });
  const pads = String(part(bike, 'padsR')?.model ?? part(bike, 'padsF')?.model ?? '').trim();
  out.push(pads ? { id: 'tl-pads', text: 'Spare brake pads: {model}', vars: { model: pads }, why: 'Your brakes' } : { id: 'tl-pads', text: 'Spare brake pads', why: 'For long descents and wet days' });
  if (known(part(bike, 'shock')) || known(part(bike, 'fork'))) out.push({ id: 'tl-shockpump', text: 'Shock pump', why: 'Your bike has suspension' });
  if (known(part(bike, 'battery'))) out.push({ id: 'tl-battery', text: 'Charging cable for the shifting battery', why: 'Your bike has a battery' });
  out.push({ id: 'tl-ties', text: 'Cable ties and some tape', why: 'For quick fixes' });
  return out;
}

/** Your list, or the suggestions for the bike (translated with t) while nothing is saved. */
export function toolsOf(stored = {}, bike = null, tyres = undefined, t = (x) => x) {
  if (Array.isArray(stored?.tools)) return stored.tools.map((r) => ({ id: r.id, text: String(r.text ?? ''), why: String(r.why ?? ''), done: r.done === true }));
  return fresh(bike, tyres, t, []);
}

/** The suggestions again, keeping the ticks of the same rows (for «Suggestions for the bike again»). */
export function fresh(bike, tyres, t = (x) => x, old = []) {
  const done = new Set(old.filter((r) => r.done).map((r) => r.id));
  return suggestTools(bike, tyres).map((s) => ({ id: s.id, text: t(s.text, s.vars), why: t(s.why), done: done.has(s.id) }));
}
