/**
 * The Excel "Brand" column often holds brand + model + colour in one text,
 * e.g. "Garmin Edge 1040 Solar" or "Scott white". splitBrand() separates the
 * brand from the rest (model, colour, variant), so the brand field only says who made it.
 */

// Longer names first, so "Sea to Summit" wins over a shorter match.
const KNOWN = [
  'Sea to Summit', 'Col du Galibier', 'Under Armour', 'Wolf Tooth', 'Quad Lock', 'Piz Buin', 'Muc-Off', 'SQ Lab',
  'Adidas', 'Aerothan', 'Albion', 'Anker', 'Apidura', 'BBB', 'Bic', 'Buff', 'Burton', 'California', 'Canyon', 'CycPlus',
  'Decathlon', 'dhb', 'Ergon', 'Exposure', 'Fitbit', 'Forclaz', 'Garmin', 'Giordana', 'Gore', 'Haglöfs', 'Insta360',
  'Isostar', 'Knog', 'Lezyne', 'Marine', 'Nike', 'Nitecore', 'Nivea', 'Ortlieb', 'Patagonia', 'Petzl', 'Rapha',
  'Samsung', 'Schwalbe', 'Scott', 'Specialized', 'SPOT', 'Swatch', 'Syncros', 'Tailfin', 'Topeak', 'Tubolito', 'Victorinox',
].sort((a, b) => b.length - a.length);

// Products whose maker is not written in the text.
const PRODUCT = { AirPods: 'Apple' };

// Texts that are no brand at all (only a colour or a remark).
const NO_BRAND = /^(white|black|grey|gray|red|blue|yellow|\(current\))$/i;

/** "Garmin Edge 1040 Solar" → { brand: "Garmin", model: "Edge 1040 Solar" } */
export function splitBrand(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return { brand: '', model: '' };
  if (NO_BRAND.test(text)) return { brand: '', model: text };
  if (PRODUCT[text]) return { brand: PRODUCT[text], model: text };
  const lower = text.toLowerCase();
  const hit = KNOWN.find((b) => lower === b.toLowerCase() || lower.startsWith(b.toLowerCase() + ' '));
  if (!hit) return { brand: text, model: '' };
  return { brand: hit, model: text.slice(hit.length).trim() };
}

/**
 * Tidy items that have never been split (no `model` field yet), e.g. after
 * importing an older backup. Items that already have `model` stay untouched,
 * so this is safe to run on every start.
 */
export async function tidyBrands(db) {
  const todo = await db.items.filter((i) => i.model === undefined).toArray();
  if (!todo.length) return 0;
  await db.items.bulkPut(todo.map((i) => ({ ...i, ...splitBrand(i.brand) })));
  return todo.length;
}
