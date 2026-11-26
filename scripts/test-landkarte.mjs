// Test-Landkarte (Noah «1-8» 26.11.2026, Plan «Tests auf den neuen App-Stand bringen», Schritt 1).
// Ordnet jede Test-Datei einem Bereich der App und einer Etage zu und zählt, was veraltet oder wackelig aussieht.
// Es ändert und löscht nichts. Aufruf:
//   node scripts/test-landkarte.mjs            Tabelle je Bereich (Markdown)
//   node scripts/test-landkarte.mjs --liste    jede Datei mit Bereich, Etage und Merkmalen
//   node scripts/test-landkarte.mjs --json     alles als JSON
// Die Zahlen stehen absichtlich nicht in docs/tests.md (sie ändern sich mit jedem PR); dort stehen nur Bereiche und Regeln.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Die Bereiche der App (wie die Zeilen in docs/app-stand.md, zusammengefasst). Der erste Treffer gewinnt,
 * darum stehen die genauen Muster vor den groben. Geprüft wird der Dateiname ohne Endung.
 */
export const AREAS = [
  ['Tests, Regeln und Doku', /^(regeln|appstand|wackel|ci-|version-at-merge|release-notes|test-summary|behind|projektablage|nacht-|nacht$|rundgang|probe|spick|inspect|landkarte|testdata|unitdone|clock-fixture|funktion-vollstaendig|featreg|style-lint|size-guard|namen-de)/],
  ['Sprache, Wissen und Neuigkeiten', /^(i18n|de-luecken|namesde|wissen|gutzuwissen|gut-zu-wissen|whatsnew|wasneu|news|ausprobieren|pagetexts|pageinfo|quickstart|schnellstart|firststart|erststart|start-neustart|inhalt|hinweis|hinweise|tipp|tips|titel|waittitle|umbruch|lange-woerter|schreibweise|neu-seit|neusei|neuekm|neue-kilometer|neueste|updates|swupdate|versionline|help|handbook|anleitungen|intro|erklaer|explain|slide|tabinfo)/],
  ['Assistent und KI', /^(assistent|gemini|localai|ask-|au$|auffaellt|denkt-mit|helfer-code|frag-merkt|warumregeln|so-siehts-aus|sosieht)/],
  ['Erinnerungen und Push', /^(push|remind|reminder|erinnerung|erinnerungen|erinnerungszeit|nacht-push|nebel-push|alertseen|nudge)/],
  ['Mein Tag', /^(mein-tag|tag-|termine|termin-|zeitleiste|zeitziehen|pfeile|ziehen|todos|merken|notiztodo|abendtour|abendblick|spaeter|schon-lange)/],
  ['Heute', /^(tick|haken|abhaken|heute|home|neuheute|neu-heute|kachel|tiles?$|tilediet|glance|jetzt-dran|moment|momentcard|satz-zum-tag|spruch|today|nudge|hallo|haus-hueter|duetoday|zustand-heute|dein-stand|stand-)/],
  ['Wi gaht\'s und Fragen', /^(abfrag|frag|fragen|feel|healthfeel|datenfragen|trainfragen|zusatzfragen|check-fragen|tages-check|tagescheck|tagessatz|tagesziel|ruhig|erwartung|ess-erinnerung|wohl|formchecks|checks|check$|tag$|gestern-nachtragen|dauer-nachtragen|nachtragen)/],
  ['Packen', /^(backpacks|barelabel|charge|paket-g|paket-h|paketn|prep|preparation|wiefaehrst|pack|bag|schnellpacken|lernen-packen|griff|tourgepaeck|taschen|setups?$|setup-rig|rig$|weigh|weights|gesamtgewicht|blocks|bloecke|bausteine|block|sheetblock|folgen|bedarf|passregel|passthier|swap|vorrat|supplies|abholwerte|packliste|trip-?pack|weg-packen|flowbag|mehrere-tage|biwak|feierabend-biwak|sporttasche|ablauf-packen|verpflegung|fuel|kmbook-x|lieblingsteile|faustregel)/],
  ['Kleider', /^(wardrobe|wear|kleider)/],
  ['Gipfelbuch und Rückblick', /^(berge|bergnotfall|funde|debrief|rueckblick|gipfel|nussgipfel|logbuch|nach-der-fahrt|quickdebrief|erkenntnisse|lernen-rueck|geschafft|fast-geschafft|fahrtenliste|deinefahrten|ridelog|ridelist|tour-beendet|review|sicherung-pruefen|versuch-)/],
  ['Unterwegs und Karte', /^(after-hoehe|dayride|compass|nacht$|live|ride|unterwegs|map|reroute|umweg|route|nebel|gpx|kartealle|karte|karten|staticmap|stopps|stops|stage|streckenform|tourkarte|hoehenprofil|hoehe|nachtlicht|brouter|osm|layers|marker|markierung|schlafplatz|unterstand|sonnen|sonne|zoom)/],
  ['Touren', /^(tour|trips|touren|einetour|meine-?tour|abfahr|abfahrt|mini-abfahrt|miniabfahrt|templates|vorlagen|past|reise|ablauf-nachdertour|zug|zugheim|ausflug|erst|gt20|vorschlaege|suggest|pfad|ringweg|etappe|meilenstein|durchklick|ausfall)/],
  ['Auswerten und Analyse', /^(azmnormal|usualdauer|valuefields|masse|situation|situations|reasons|beobachtungen|analyse|ausw|auswert|charts|zusammenh|gewicht|einheiten|insights|leistung|pace|tempo|vergleich|heatmap|sportjahr|zeitraum|form|bike?hours|glaette|axis|series|messen|messwerte|werte|zahlen|estimate|odometer|puls|yearcheck|yeargoals|sternjahr|jahr|profile|sportrueckblick|lernen-rueckschau|stand$|reste|trial|zonen|spark|ampel|calc|readiness|vo2|vitals|koerper|body|energie)/],
  ['Training, Woche und Challenge', /^(almost|balance|comeback|fit$|fit-|freude|tipweek|punkte|milestone-dup|ms-ordnen|flecken|daycap|flow|aktiv|training|trainingpeaks|trainingsplaene|woche|wochen|wochenplan|week|alle-woche|challenge|herausforderung|meditation|hobby|erholung|ruhetag|sport|bewegung|activities|aktivit|actlite|rituale|routine|rhythmus|lustwoche|mein-trainingsplan|plan|planen|skiplan|skitourplan|ski|skiday|skiseason|schwung|ws6|timer|zeitplan|tp-|weg-training|ziel|goal|saisonstart|phase|geburtstag|taschen$)/],
  ['Velos und Pflege', /^(chainplan|velo|bike|kmbook|odometer|care|pflege|quickcare|werkstatt|kette|verschleiss|belag|ausstattung|inspektion|repair|rahmen|vane|ws5|impeccable-velos|impeccable2-velos|standard-velo|welches-velo|tacho|klingel|reifen)/],
  ['Material', /^(strom|strombudget|gear|material|ausruestung|lend|leih|wunsch|importgear|einzeln-material|maingear|tourgear|equipment|shop$|lastshop|nextshop|vouchers|abfahrt)/],
  ['Wetter', /^(next3h|nightlight|sonntag|sterne|nextstars|naechste-sterne|naechster-stern|neuer-stern|wetter|weather|wx|regen|schnee|kaelte|seetemperatur|licht|nachttemperatur|sonnenaufgang|schneegrenze|nebelgrenze|wind|water|wasser|season|jahreszeit|lamp)/],
  ['Rennen', /^(race|rennen|atlas|nonstop|racecard)/],
  ['Suche und Finden', /^(weg$|weg-|wege|wegegedaechtnis|staerken|favorites|suche|search|allesfinden|alles-finden|kisuche|wegweiser|features?$|functions|tippzahl|heimat|absprung|appmap|appskizze|app-|seiten$|seiten|karte-der-app|alles-hier|alleshier|aktiv-alles-hier|quicklinks|schnell-oeffnen|links|zusammenlegen|navigation|nav$|seitenleiste|menu|neu-menue|tabs|brotkrumen|zurueck|weiter|gehoert|haengt|vorrat-suche|discover|entdeck|inspiration|areas|hubs|lernen$|lernen-|stand-warten|bereit|ready|erscheint|wann|sets|spot|panorama)/],
  ['Ich, Daten und Sicherung', /^(werkzeugkasten|backup|sync|folderBackup|daten|datei|import|export|trash|papierkorb|zuletzt|ich|me$|account|abgleich|storage|maintenance|dbcache|dbwait|persist|offline|privacy|private|sicher|merge|verlust|aufraeumen|cleanup|alles-anpassbar|allesbearbeiten|anpassen|ownlists|ownvalues|listen|lists|standard|domains|eigene|dropkind|category|choices|ordnung|order|drafts|autofresh|freshreload|leer-laden|lade|schreibfelder|localday|localai|code-datei|group|gruppen?$|docgroups|doc-gruppen|groups|sportgroups|packgroups|geloescht|rueckgaengig|confirm|bestaetigung|undo|toasts|wiederholen)/],
  ['Verbindungen', /^(strava|garmin|komoot|trello|google|mail|applehealth|apple-health|fitbit|health|integrations|connstatus|verbindungen|kamera|spielerplus|twint|connect|api|server|boot|kein-echter-server|sw-api|ask-server)/],
  ['Kurse und Bezahlen', /^(kurs|pay|bezahl|booking|customers|rechnung|bill|invoice|quittung|kontakt|probestunde|offer|tennis|flyer|buchen|wunschanfrage|sammelwand|preis)/],
  ['Notizen, Dokumente und Eingang', /^(context|notes?|notiz|notebook|notefiles|noteformats|docs?$|doc-|docs|journal|tagebuch|inbox|eingang|ein-eingang|eingaben?|ideen|einzelideen|einzelgross|einzelplanen|richtext|diktat|bilder|bild|foto|album|fotoalbum|video|scan|belege)/],
  ['Neuland, Träume und Abenteuer', /^(ort|orte|poi|pinmarks|placefiles|neue-sammlungen|neuland|traum|traeume|dreams|erfuellt|erfuellte|abenteuer|ein-abenteuer|monat|wuerfel|wochentraum|frei|freiezeit|bereit-fuer-traum|link-wird-traum|wetterfenster-traeume|nachtraeume)/],
  ['Gruppen, Freunde und Mini-Apps', /^(freunde|people|gruppe|groupevent|gruppenevent|event|mini|mitmachen|share|teilen|teilnehmerliste|twint-teilen|hotelasks|fuenforte|marker)/],
  ['Kochen und Alltag', /^(koch|rezept|essen|naehrwerte|ess|zwift|indoor|abend-|alltag|ablauf-alltag|stand-alltag)/],
  ['Aussehen und Bedienung', /^(look|werkzeugkasten-x|guard|a11y|fenster|tippflaechen|scrollen|scroll|dark|dunkel|kontrast|schrift|layout|ui|dialog|backclose|sheet|icons|tone|schmal|seitengroesse|seiteninhalt|bedienung|bedienregeln|rueckmeldung|gesten|swipe|swipe-tick|wischen|doubletap|doppeltipp|aufklappen|einblenden|fadein|fineline|fineprofile|finish|ghost|griffbereit|hauptaktion|hochheben|knoepfe|kuhglocke|logo|murmeltier|design|calm|impeccable|ich-design|aktiv-design|packen-design|velo-design|touren-design|material-design|labels|markup|menu-close|landscape|landschaft|handy-kurz|kurz|anzeige|bloecke|emptyscene|leere|leer|beispiel|unterstuetzt|loader|nicht-gefunden|errors|error|fehler|tote-knoepfe|windows|zurueck-fenster|durchklick|seitenwechsel|pullrefresh|ziehen-aktualisieren|oneatatime|onlyexamples)/],
];
export const SONST = 'Sonstiges';

/** Namen aus der Zeit der Bauschritte: Version, Paket, Etappe (sagen nichts über den Teil der App). */
export const BAUSCHRITT_NAME = /^(v0\d+|ap\d+|pf$|sn\d?[a-z]*\d?[a-z]*$|sn-[a-z]$|at1|aj1|hg1|tz\d|stage\d|teil2|abnahme|etappe|calm\d|paket|ws\d|s2-|detail\d|bugfixes\d|weigh\d|gpx\d|list\d|trips0?301|home-?0460|material0472|review044|wardrobe04\d|velo2610|rueckblick049|q1km|m4b|a-einzeln|b-einzeln|impeccable2?-)/;

/** Etage 1 (Alltagswege) gibt es erst mit Schritt 2; Etage 2 sind die Wächter, die die ganze App prüfen. */
export const WAECHTER = new Set([
  'guard', 'flow', 'tippzahl', 'functions', 'heimat', 'tote-knoepfe', 'seitengroesse', 'fenster-nie-abgeschnitten',
  'wege-waechter', 'a11y', 'durchklick', 'ausprobieren',
]);

/** Erstes Wort der Adresse (#/trips/fuel → trips) → Bereich; dient als Ausweg, wenn der Dateiname nichts sagt. */
export const ROUTE_AREAS = {
  '': 'Heute', pack: 'Packen', trips: 'Touren', trip: 'Touren', ride: 'Unterwegs und Karte', live: 'Unterwegs und Karte',
  debrief: 'Gipfelbuch und Rückblick', gear: 'Material', bikes: 'Velos und Pflege', wardrobe: 'Kleider', me: 'Ich, Daten und Sicherung',
  flow: 'Training, Woche und Challenge', woche: 'Training, Woche und Challenge', auswerten: 'Auswerten und Analyse', analyse: 'Auswerten und Analyse',
  race: 'Rennen', rennen: 'Rennen', wetter: 'Wetter', notes: 'Notizen, Dokumente und Eingang', inbox: 'Notizen, Dokumente und Eingang',
  features: 'Suche und Finden', assistent: 'Assistent und KI', kurse: 'Kurse und Bezahlen', neuland: 'Neuland, Träume und Abenteuer',
  dreams: 'Neuland, Träume und Abenteuer', blocks: 'Packen', favorites: 'Suche und Finden', tag: 'Mein Tag', day: 'Mein Tag',
};

export function routeAreaOf(text) {
  const count = new Map();
  for (const m of text.matchAll(/#\/([a-z-]*)/g)) count.set(m[1], (count.get(m[1]) ?? 0) + 1);
  let best = null;
  for (const [k, n] of count) if (ROUTE_AREAS[k] && (!best || n > best[1])) best = [k, n];
  return best ? ROUTE_AREAS[best[0]] : null;
}

export function areaOf(name, text = '') {
  for (const [area, re] of AREAS) if (re.test(name)) return area;
  return routeAreaOf(text) ?? SONST;
}

function walk(dir, ext, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (ext.test(e.name)) out.push(p);
  }
  return out;
}

/** Etage und Art einer Datei, aus ihrem Pfad. */
export function etageOf(path, name) {
  if (/^tests\/e2e\/(gesamttest|nachtrundgang|live)\//.test(path)) return '2 Wächter (nachts)';
  if (/^tests\/e2e\//.test(path)) return WAECHTER.has(name) ? '2 Wächter' : '3 Bereichstest';
  return '4 Unit-Test';
}

export function landkarte(root = '.') {
  const files = [
    ...readdirSync(join(root, 'tests')).filter((f) => /\.test\.js$/.test(f)).map((f) => `tests/${f}`),
    ...walk(join(root, 'tests/e2e'), /\.spec\.js$/).map((p) => relative(root, p).replace(/\\/g, '/')),
  ].filter((p) => !/\/tmp-durchklick\//.test(p));
  return files.sort().map((path) => {
    const name = basename(path).replace(/\.(test|spec)\.js$/, '');
    const text = readFileSync(join(root, path), 'utf8');
    const head = text.split('\n').slice(0, 12).join('\n');
    return {
      path,
      name,
      area: /\/(gesamttest|nachtrundgang|live)\//.test(path) ? 'Ganze App' : areaOf(name, text),
      etage: etageOf(path, name),
      lines: text.split('\n').length,
      cases: (text.match(/^\s*(?:test|it)(?:\.each)?\s*\(/gm) ?? []).length,
      bauschrittName: BAUSCHRITT_NAME.test(name),
      versionImKopf: /^\/\/.*\bv0\.\d+/m.test(head),
      festeWartezeiten: (text.match(/waitForTimeout\s*\(/g) ?? []).length,
      liestQuelltext: /readFileSync\s*\([^)]*(?:src|docs)/.test(text),
      geaendert: statSync(join(root, path)).mtimeMs,
    };
  });
}

/** Zusammenfassung je Bereich. */
export function summary(rows) {
  const by = new Map();
  for (const r of rows) {
    const s = by.get(r.area) ?? { area: r.area, unit: 0, browser: 0, waechter: 0, cases: 0, alt: 0, wartezeiten: 0, quelltext: 0 };
    if (r.etage.startsWith('4')) s.unit++;
    else if (r.etage.startsWith('3')) s.browser++;
    else s.waechter++;
    s.cases += r.cases;
    if (r.bauschrittName || r.versionImKopf) s.alt++;
    s.wartezeiten += r.festeWartezeiten;
    if (r.liestQuelltext) s.quelltext++;
    by.set(r.area, s);
  }
  return [...by.values()].sort((a, b) => b.unit + b.browser + b.waechter - (a.unit + a.browser + a.waechter));
}

export function toMarkdown(rows) {
  const s = summary(rows);
  const sum = (k) => s.reduce((n, x) => n + x[k], 0);
  const lines = [
    '| Bereich | Unit-Dateien | Browser-Dateien | Wächter | Fälle | Alt (Name oder Kopf) | Feste Wartezeiten | Liest Quelltext |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...s.map((x) => `| ${x.area} | ${x.unit} | ${x.browser} | ${x.waechter} | ${x.cases} | ${x.alt} | ${x.wartezeiten} | ${x.quelltext} |`),
    `| **Zusammen** | ${sum('unit')} | ${sum('browser')} | ${sum('waechter')} | ${sum('cases')} | ${sum('alt')} | ${sum('wartezeiten')} | ${sum('quelltext')} |`,
  ];
  return lines.join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = landkarte('.');
  if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2));
  else if (process.argv.includes('--liste')) {
    for (const r of rows) {
      const flags = [r.bauschrittName && 'Bauschritt-Name', r.versionImKopf && 'Version im Kopf', r.festeWartezeiten && `${r.festeWartezeiten}x feste Wartezeit`, r.liestQuelltext && 'liest Quelltext'].filter(Boolean).join(', ');
      console.log(`${r.area}\t${r.etage}\t${r.path}\t${r.cases} Fälle\t${flags}`);
    }
  } else console.log(toMarkdown(rows));
}
