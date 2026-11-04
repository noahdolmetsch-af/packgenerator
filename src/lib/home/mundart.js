/**
 * «Wetter-Sprüche auf Mundart» (Noah 03.11.2026, Idee 27): under the date and weather line of Today one short
 * Swiss German saying about the weather, e.g. «Hüt isch Pfüdi-Wätter, Regejagge ii!». Like the greeting (HG1 1a)
 * it is always Swiss German, whatever the app language, so the words are plain constants and do not go through
 * t(). The saying is picked by the day (the same all day, another tomorrow), from the kind of weather
 * (weatherLine of heute.js: rain, showers, dry until it rains, dry) and the warmth. {d} is «hüt» or «morn».
 * Pure, tested in tests/mundart.test.js. Can be switched off in Ich › Darstellung › Bedienung.
 */

export const HOT_C = 26;
export const COLD_C = 3;

export const MUNDART = {
  rain: [
    '{D} isch Pfüdi-Wätter, Regejagge ii!',
    'Es schiffet {d}: Regejagge a und los!',
    '{D} git’s Wasser vo obe. Chrüüz und quer ids Pfüdi!',
    'Nassi Strass {d}: Schutzbläch und Geduld.',
  ],
  showers: [
    'Es paar Schüürli chönnte cho: d’Jagge i d’Täsche.',
    '{D} blinzlet d’Sunne und es tröpfelet es bitzli.',
    'April-Wätter, au wenn’s kei April isch.',
  ],
  dryuntil: [
    'Zersch trochni Strass, spöter chönnt’s nässle. Gscheit isch, wär früeh fahrt.',
    'Es hebt no es Wiili, dänn luegt d’Wolke scho wieder.',
    'Jetz fahre, spöter luege: d’Regejagge isch dihei nüt wert.',
  ],
  dry: [
    'Schöns Wätter {d}: uf’s Velo!',
    'Trochni Strass, guets Gfüehl: los gaht’s.',
    'Kei Wolke i Sicht. Dä Tag git’s Velo-Wätter!',
    '{D} isch en guete Tag für e Fahrt.',
  ],
  hot: [
    'Hitz {d}: gnueg Wasser mitnä und en Huet uf!',
    'Es isch heiss. Schatte sueche und Brünneli aluege!',
  ],
  cold: [
    'Brrr, chalt {d}! Handschueh a und Mütze uf.',
    'Es isch frisch: dick azieh, dänn wird’s scho warm.',
  ],
};

/** The calendar day 'YYYY-MM-DD' as a whole number (days since 1970), for picking by the day. No clock math. */
const dayNo = (day) => {
  const [y, m, d] = String(day ?? '').split('-').map(Number);
  return Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d) ? Math.floor(Date.UTC(y, m - 1, d) / 864e5) : 0;
};

/**
 * The saying for the weather line {kind, temp, when} on a calendar day, or null without a weather line.
 * Rain, showers and «dry until» come first, then very hot or cold, else the dry sayings.
 */
export function mundartFor(wx, day) {
  if (!wx?.kind) return null;
  let key = wx.kind;
  if (key === 'dry' || key === 'dryuntil') {
    if (Number.isFinite(wx.temp) && wx.temp >= HOT_C) key = 'hot';
    else if (Number.isFinite(wx.temp) && wx.temp <= COLD_C) key = 'cold';
  }
  const list = MUNDART[key];
  if (!list) return null;
  const d = wx.when === 'tomorrow' ? 'morn' : 'hüt';
  const raw = list[dayNo(day) % list.length];
  return raw.replace('{D}', d === 'morn' ? 'Morn' : 'Hüt').replace('{d}', d);
}
