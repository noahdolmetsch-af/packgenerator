# Technik-Handbuch: wie der Code funktioniert und wie man die App wartet

Für Noah und für jeden Helfer (Mensch oder KI), der an der App arbeiten soll. Deutsch, einfach, mit Fachwörtern nur dort, wo man sie später suchen muss (erklärt beim ersten Mal). Der Schnappschuss dieser Datei stammt vom 5. November 2026. **Gilt der Code anders, gilt der Code**, und der PR, der es merkt, korrigiert diese Datei.

Verwandt: [Aufbau](aufbau.md) (Seiten, Wege, Zusammenhänge, Wörterbuch), [App-Stand](app-stand.md) (alle Funktionen mit Link), [Notfall-Handbuch](notfall-handbuch.md) (wenn etwas kaputt ist), [Konten-Liste](konten.md), [Noah-Wissen](noah-wissen.md) (was du selbst tun und prüfen musst), [CLAUDE.md](../CLAUDE.md) (die verbindlichen Regeln).

## 1. Die App in zehn Zeilen

- **Svelte 5 + Vite**: Svelte baut die Oberfläche, Vite packt alles zu Dateien. Geschrieben ist es in JavaScript (kein TypeScript).
- **Dexie (IndexedDB)**: die Datenbank im Browser. Alle Daten liegen nur auf dem Gerät.
- **PWA**: die App lässt sich installieren und läuft offline (Service Worker über `vite-plugin-pwa`).
- **GitHub Pages** liefert die App aus: https://noahdolmetsch-af.github.io/packgenerator/.
- **Vercel «packgen»** (Ordner `api/`) ist ein kleiner Server nur für die Extras: Strava, Fitbit/Google, KI-Helfer, Push, Abgleich, Buchung und Bezahlen (Testmodus).
- **Upstash** (Schliessfach) speichert für den Server Logins und den Handy-Computer-Abgleich.
- **GitHub Actions** baut, testet, veröffentlicht und prüft jeden Morgen, ob alles lebt.
- Jede Änderung ist ein **Pull Request (PR)**; ein Test-Rundgang im Browser (Playwright) und über 680 Unit-Test-Dateien (Vitest) sichern sie ab.
- Alle Texte der App sind **Englisch im Code** und gehen durch `t('English')`; die deutschen Texte stehen in `src/lib/i18n/de/*.js`.
- Das Repository ist **öffentlich**: nie etwas Persönliches hinein (Backups, Fotos, GPX, Excel, echte Namen).

## 2. Ordnerkarte

| Ordner | Inhalt |
|---|---|
| `src/App.svelte`, `src/main.js`, `src/start.js` | Start der App, Kopf, Navigation, Tabelle `PAGES` (Seiten laden erst beim Öffnen) |
| `src/pages/` | je eine Datei pro Seite (`Home`, `Pack`, `Tour`, `Live`, `Bikes`, `Me`, `Wetter`, `Analyse` …) |
| `src/lib/` | alles andere: Rechnungen (`*.js`), kleine Bausteine (`*.svelte`) und je Bereich ein Unterordner (`wetter/`, `live/`, `home/`, `sync/`, `route/`, `bikes/` …) |
| `src/lib/db.js` | die Datenbank: Tabellen, Schema-Versionen, `DATA_TABLES` (was gesichert wird) |
| `src/lib/features.js` | Katalog aller Funktionen (Name, Link, Handbuch-Schritte, Beispiel) |
| `src/lib/news/` | eine Datei pro PR für «Was ist neu» |
| `src/lib/i18n/de/` | die deutschen Texte, in Dateien nach Anfangsbuchstaben gebündelt |
| `api/` und `api/_lib/` | der Server (siehe 7) |
| `tests/*.test.js` | Unit-Tests (Vitest), rund 690 Dateien |
| `tests/e2e/` | Browser-Tests (Playwright), rund 580 Specs; `gesamttest/` (Rundgang mit 700 erfundenen Dingen), `nachtrundgang/`, `live/` |
| `scripts/` | Hilfsprogramme: `news.mjs` (Versionen), `size-guard.mjs` (Grössen-Wächter), `ci-scope.mjs` (welche Tests ein PR braucht), `privatecheck.mjs` (Wächter gegen private Daten) u. a. |
| `tools/` | einmalige Werkzeuge: Handbuch erzeugen (`handbuch.mjs`), Excel-Import, Bezahl-Codes |
| `docs/` | die Dokumentation; `docs/releases/` eine Datei pro PR |
| `public/` | Symbole, Schriften, Service-Worker-Teile, Datenschutz-Seite |
| `apps/`, `buchen/` | die kleinen Apps (eigene Startseite je App) und die Buchungsseite für Kunden |
| `qa/`, `archive/` | Beispielbilder aus Tests, Altes. Nach Testläufen `git checkout -- qa/` |

## 3. Daten: Dexie, Backup, Abgleich

- **Tabellen** stehen in `src/lib/db.js`. `DATA_TABLES` ist die Liste dessen, was ein Backup und der Abgleich mitnehmen. `SCHEMA_VERSION` und die `db.version(n).stores(...)`-Blöcke sind die Schema-Geschichte; ein neuer Block kommt nur dazu, wenn sich Felder mit Index ändern. **Eine Änderung an Schema oder Backup-Format prüft man zuerst mit einer Kopie eines Backups** (Regel 3 in CLAUDE.md).
- **Tabelle `settings`** (Schlüssel/Wert) hält fast alle Schalter und kleinen Zustände. Neue Schalter gehören dorthin, nicht in eine neue Tabelle.
- **Backup** (`src/lib/backup.js`): die ganze App als eine JSON-Datei, optional mit Passwort (`backupcrypt.js`). Dieselbe Datei dient für Export/Import, die Ordner-Sicherung am Computer (`folderBackup.js`) und den einmaligen Excel-Import. Die App legt vor jedem Update eine Kopie an (Ich › App-Wartung).
- **Abgleich Handy–Computer** (`src/lib/sync/`, Server `api/sync.js`): `track.js` vermerkt jede Änderung, `engine.js` holt und schickt in Runden; was beide Geräte geändert haben, entscheidet die neuere Änderung, die ersetzte Fassung bleibt 30 Tage in einem stillen Verlauf. Daten sind mit dem Kopplungscode verschlüsselt.
- **Löschen mit Rückgängig**: nie `confirm()`, immer `askDelete` und `deleteWithUndo`. Löschen fragt, wohin abhängige Dinge gehen (z. B. Touren eines Velos, `src/lib/bikedelete.js`). Gruppen: `GroupDeleteSheet.svelte`, neue Gruppenart in `GROUP_PLACES` (`src/lib/groups.js`).
- **Listen und Typen** (`STANDARD_LISTS` in `src/lib/standard.js`, angewendet in `lists.js`): jede Liste der App ist vom Nutzer änderbar.
- **Heutiger Tag**: immer `localDay()` aus `src/lib/localday.js` (Kalendertag in Europe/Zurich), nie `toISOString().slice(0,10)` und nie `Date.now() + n*864e5`.

## 4. Seiten, Navigation, Fundstellen

- Die Adresse ist ein **Hash** (`#/pack`, `#/me/handbook` …). `src/App.svelte` liest ihn und zeigt die Seite.
- Nur **Heute** (`Home.svelte`) wird beim Start geladen. Jede andere Seite steht in `PAGES` als `Name: () => import('./pages/Name.svelte')` und wird mit `<LazyPage load={PAGES.Name} />` gezeigt (`src/lib/nav/lazy.js`). Grosse Werkzeuge (PDF, Texterkennung, Bildmodelle, Video) laden mit `await import()` erst beim ersten Gebrauch.
- **Funktionskatalog** `src/lib/features.js`: jede Funktion mit Id (`f.weather`), Link, Handbuch-Schritten und Beispiel. Daraus entstehen «Karte der App» (`#/me/karte`), der Funktionskatalog und das Handbuch (`node tools/handbuch.mjs`).
- **Fertig-Regel** (CLAUDE.md, «Every PR»): eine neue Funktion braucht (1) Eintrag in `features.js`, (2) einen Absprung (`PASST_HIER` in `src/lib/passthier.js`, `tests/absprung.test.js`), (3) einen «Gut zu wissen»-Text (`src/lib/wissen/`), (4) einen Leer-Zustand (`ui/Empty.svelte`), (5) «Als Nächstes», (6) eine Zeile in `docs/app-stand.md`. Ein Teil, der fehlt, steht im PR unter «Selbst entschieden».
- **Moment**: eine neue Funktion kommt auch in `FEATURE_MOMENTS` (`src/lib/moment.js`).
- **Alles hier** (`src/lib/alleshier.js`, `ui/AllHere.svelte`): je Bereich ein Feld mit allen Kacheln, damit nichts versteckt ist (Wächter `tippzahl`, höchstens 3 Tipps).

## 5. Die wichtigsten Bausteine nach Thema

### Wetter (`src/lib/wetter/`)
- `kern.js`: **ein** Wetter-Kern für die ganze App (eine Abfrage, zwischengespeichert). Weitere Module hängen daran: `stunden.js` (die nächsten 2 bis 8 Stunden), `regen24.js`, `gewitter.js`, `licht.js` (Sonne und Licht), `schneegrenze.js`, `klima.js` (weit voraus), `treffer.js` (Prognose gegen Wirklichkeit).
- `profil.js`: **eine gemeinsame Abfrage der Luftschichten** (Druckflächen 1000 bis 600 hPa) pro Ort, 3 Stunden zwischengespeichert (`wx-profil:`). Darauf bauen `nebelgrenze.js` (Obergrenze des Hochnebels aus Feuchte, Inversion und tiefen Wolken; Schwellen `DAMP`, `TOP_AT`, `LOW_CLOUD`, `CAP_LAPSE`) und die Temperaturen nach Höhe. **Nie eine zweite Abfrage dafür bauen.**
- Quelle: Open-Meteo, MeteoSchweiz und weitere offene Dienste, alle ohne Konto. Die Entwicklungsumgebung erreicht Open-Meteo nicht: Rechnungen sind nur mit erfundenen Daten getestet, die echte Gegenprobe macht Noah auf der Seite.
- Anzeige: Seite `Wetter.svelte` mit Reitern (`?tab=jetzt|radar|planen|rueckblick`, öffnet immer auf «Jetzt»), Heute (`HeuteWetter`, `HeuteNebel`, `HeuteSchnee`), Tour (`TourWetter.svelte`). Fremde Seiten (Landi-Radar, SRF-Webcams) laden im Fenster erst beim Antippen; «Bleibt leer?» schaltet sie aus (`wxFramesOff`).

### Routing und Live-Navigation
- `src/lib/reroute.js`: **eine Tür zum Router** (`askRouter`): BRouter auf brouter.de, Profile `trekking` und `fastbike`, Zeitlimit 15 s, ein zweiter Versuch nur bei schnellem Fehler, 10 Minuten Zwischenspeicher, Abbruch über 200 km, klare Meldungen (`routerMsg`). `RouterNote.svelte` sagt, dass brouter.de die Wegpunkte zwei Wochen speichert. Falsches Profil gibt HTTP 500 (die App deutet das als «kein Weg»).
- Beschlossen, noch nicht gebaut: Reserve-Kette brouter.de → Valhalla → OSRM, Profile «Wie fährst du?», Belag aus den WayTags der BRouter-Antwort, Notausstiege (siehe [Stand und Plan](stand-und-plan.md#22-routing-und-navigation-kette)).
- `src/pages/Live.svelte` (Karte, Fahrt, Pausen) und `src/lib/live/` (Teile: `liveroute.js`, `next3h.js`, `lamp.js`, `nightlight.js`, `pause.js`, `alert.js` …). Die Fahrt läuft nach einem Neuladen 3 Stunden weiter und wird in «Touren» gespeichert.
- Karten: MapLibre (`maplibre-gl`) und Leaflet; Offline-Kartenstreifen über `public/offline-map-sw.js`.

### Heute
- `src/pages/Home.svelte` und `src/lib/home/`. Heute ist nach **Bereichen** (`home/sections.js`) geordnet, nicht nach einer Bereitliste. «Jetzt dran» zählt nur Dringendes; ruhige Hinweise stehen darunter.

### Texte und Sprache
- Jeder neue UI-Text geht durch `t('English')` und braucht einen deutschen Eintrag in `src/lib/i18n/de/<name>.js`; die Dateien werden automatisch geladen (kein Eintrag in `de/index.js` nötig). `tests/de-luecken.test.js` und der Gesamttest scheitern bei fehlendem Deutsch oder englischen Wörtern in der deutschen Oberfläche. Vom Nutzer getippte Namen gehen nie durch `t()`.

### Server (`api/`)
Je Datei eine Aufgabe, Hilfsteile in `api/_lib/`:

| Datei | Aufgabe |
|---|---|
| `strava.js` | Strava-Verbindung (nur lesen) |
| `google/` und `_lib/google*.js` | Fitbit/Gesundheit, Termine, Aufgaben, Mail, Drive |
| `helper.js`, `_lib/helper.js` | KI-Helfer (Anthropic, Gemini); Monats-Deckel |
| `push.js`, `_lib/push.js`, `webpush.js` | Erinnerungen aufs Handy; Zeitplan |
| `sync.js` | Abgleich Handy–Computer |
| `booking.js`, `pay.js` | Termine buchen, Bezahlen (Testmodus) |
| `lake.js`, `news.js`, `linkcheck.js` | Seetemperatur, News-Feeds, Link-Prüfung |
| `health.js` | Wächter-Abfrage: eine Zeile je Prüfung, nie ein Wert |

**Regeln für `api/`:** kein neues File unter `api/` ohne Grund (Vercel zählt Funktionen); Gemini nur über `api/_lib/helper.js`; Schlüssel nur in Vercel (Namen in [Konten-Liste](konten.md)); nach jeder Änderung in `api/` den Server «packgen» auf **READY** prüfen und notfalls von Hand neu bereitstellen. Die Tests erreichen den echten Server nie (`NO_REAL_SERVER` in `playwright.config.js`), sonst ist die Tageskapazität schnell weg.

## 6. Tests und CI

**Lokal:** `npm ci`, dann
- `npm test` (Vitest, alle Unit-Tests) oder `npx vitest run tests/<datei>.test.js`.
- `E2E_PORT=52xx E2E_SKIP_GESAMTTEST=1 npx playwright test <spec> --workers=1`, dazu `tests/e2e/guard.spec.js` (`--project=desktop`, sonst Zeitüberschreitung). Lokal mit vorinstalliertem Browser: `PW_CHROMIUM=/pfad/zu/chrome`. Playwright-Läufe **nie parallel** starten (`test-results` kollidiert) und während eines Laufs keine Quellen ändern.
- Danach `git checkout -- qa/`.
- Vor jedem PR nur die eigenen Specs, die Specs der geänderten Seiten und `guard.spec.js`; den Gesamttest macht GitHub.

**Regeln:** Tests lesen ihre Listen aus dem App-Code, keine Kopien. Nie einen Test überspringen oder lockern, um grün zu werden: die Ursache beheben, oder den Test anpassen, wenn die Oberfläche mit Absicht anders ist. Testdaten sind erfunden. Datum immer als Kalendertag in Zürich. Testnamen ohne «» (das hängt den Browser-Import). Neue Specs holen ihre Uhr aus `./clock.js`. Gewöhnliche `.js`-Specs importieren nie `*.svelte.js`.

**Auf GitHub** (`.github/workflows/`):

| Datei | Wann | Was |
|---|---|---|
| `deploy.yml` | jeder PR und jeder Merge auf `main` | PR: Bauen + Unit-Tests + Wächter auf dem Computer (`guard.spec.js`); **Handy-Tests (5 Teile) erst mit dem Label `ok`**. `main`: Bauen, Tests, **sofort online** (Pages) und Eintrag in «Releases» |
| `waechter.yml` | alle 3 Stunden | fragt den Server (`api/health.js`); bei Fehler ein Issue mit Mail |
| `live.yml` | morgens und nach Merges | prüft die echte App im Browser |
| `nacht.yml` | nachts | Rundgang über alle Seiten (nur Links öffnen) |
| `volle-pruefung.yml` | nachts | volle Browser-Tests auf dem Computer + Gesamttest; Rot öffnet ein Issue |
| `dependabot-automerge.yml` | Dependabot-PRs | grün → von selbst zusammenführen (Noah 26.10.2026, ohne Freigabe) |

`scripts/ci-scope.mjs`: ein PR, der nur Doku, News-Dateien oder ganze Specs ändert, führt nur die eigenen Specs aus. «Ausprobieren» tippt in einem PR nur die Zeilen der eigenen News-Dateien; nachts alle.

**Wächter in den Tests** (die häufigsten Gründe für ein rotes Häkchen):
- `appstand.test.js`: toter Link in `docs/app-stand.md`, Funktion ohne Zeile, Versionsnummer in der Datei.
- `private-data.test.js`: eine Datei wie GPX, FIT, Excel, Foto oder echtes Backup im Repo.
- `de-luecken.test.js`: `t()`-Text ohne Deutsch.
- `size-guard.test.js`: Grösse (siehe 9).
- `tippzahl.*`, `absprung.test.js`, `moment.test.js`, `groups.test.js`, `wissen.test.js`: die Fertig-Regel.
- `whatsnew.test.js`, `version-at-merge.test.js`: Version und News (siehe 8).

## 7. Von der Idee zum Online-Stand (der Ablauf)

1. Noah sagt, was kommt («1a 2b …», ein Satz im Thread). Alles muss einem der sechs Ziele in `docs/vorhaben.md` dienen, sonst fragt Claude.
2. **Ein PR pro Änderung**, kleine PRs, keine Bündel. Branch `claude/<name>`.
3. Der PR bringt: den Code, Tests, `src/lib/news/<name>.js` (1 bis 3 Punkte, `test` mit mindestens 2 Schritten, deutscher Text, `since` für neue Funktions-Ids), `docs/releases/<name>.md` (Vorlage `docs/releases/README.md`) und, wenn nötig, eine Zeile in `docs/app-stand.md`. Im PR-Text stehen «Before:» und «After:» oder die Vorlage, «Was fällt weg oder rutscht tiefer», «Was ist neu», «Selbst entschieden».
4. Bilder (Handy 390 px und Computer 1440 px, erfundene Daten) und 2 bis 4 Prüfschritte gehen in den Chat. Nur für ganz neue Seiten gibt es vorher ein Mockup.
5. **Noah gibt frei** («ok NNN», oder Tipp auf «Freigeben»). Nur sein «ok» für genau diesen PR zählt.
6. Claude setzt das **Label `ok`**; das startet die Handy-Tests. Sind alle Häkchen grün (auf dem neuesten Stand des PR), führt der **Merge-Bündler** (eine Claude-Sitzung, die nur zusammenführt) die freigegebenen PRs nacheinander zusammen. Bei Konflikt löst der PR-Besitzer ihn durch Hineinholen von `main`.
7. Nach dem Merge baut GitHub und veröffentlicht (ca. 5 Minuten, `online`-Job). Danach prüft Claude: Pages grün; bei `api/`-Änderung der Server «packgen» READY. Dann eine Zeile **«Online: …»** mit Prüfschritten an Noah.
8. Noah prüft auf der echten Seite. «zurück NNN» macht den PR sofort rückgängig (Revert-PR).

**Kleine sichere PRs** (nur Text oder Ansicht, grün, nichts mit Daten, Backup, Abgleich oder `api/`) gelten seit 31.10.2026 als pauschal freigegeben. **Schliessen** eines PR nur auf «schliessen NNN».

**Mit `main` nachziehen** heisst bei eigenen Branches **rebase** (`git rebase origin/main`, dann `--force-with-lease`); ein `git merge origin/main` in den PR-Branch macht die Versions-Tests rot, weil alle News-Dateien von `main` dann in einem Schritt kommen. Gestapelte PRs: `git rebase --onto <neue Basis> <alter Kopf>`. Lokal `git fetch --unshallow`, sonst rechnet `news.mjs` nur geraten.

## 8. Versionsnummer und «Was ist neu»

Seit 27.10.2026 (Regel 13) ändert **kein PR die Version**. `scripts/news.mjs` zählt beim Bauen jeden Merge auf `main` ab dem Anker `a15ce2ab…` (Version 0.232.0): ein Merge **mit** News-Datei erhöht die mittlere Zahl, ein Merge ohne News-Datei die letzte. Die PR-Prüfung rechnet die Nummer, die der PR bekäme, wenn er als Nächster einginge. In der App steht die Nummer unter Ich › Was ist neu; `node scripts/news.mjs` zeigt sie im Terminal (mit voller Git-Geschichte). Höchstens **eine** News-Datei pro PR. Nach dem Merge nie umbenennen. Ablage: `src/lib/news/README.md`. «Ausprobieren»: jede Zeile hat `go` (der genaue Ort, den die App antippt und aufleuchten lässt).

## 9. Grössen, Tempo, Offline

- **Start-JavaScript**: Grenze **5,0 MB** (`MAX_START_JS_BYTES` in `scripts/size-guard.mjs`), Warnung bei 90 %, heute rund 3,4 MB. Gemessen werden die Dateien, die vor dem ersten Bild laden (`main`, `start`, `icons`, `i18n`, `de-texts-*` …). Was das Limit nicht verträgt, wandert hinter `import()`.
- **Eine Datei höchstens 3 MB** (`MAX_JS_BYTES`): der Offline-Speicher nimmt Dateien bis 6 MiB, darüber startet die App ohne Internet nicht mehr.
- Die **deutschen Texte** laden als vier Dateien (`de-texts-1` bis `-4`, nach Anfangsbuchstaben) nur, wenn die App deutsch ist. «Was ist neu» und Handbuch laden erst beim Öffnen.
- **Tempo messen**: Ich › Daten › Tempo-Messer. Vorschlag bei Verdacht auf Langsamkeit: zuerst messen (4× langsamere CPU), dann ein kleiner PR. Reiter mit etwa einer Sekunde Aufbau (Träume, Pflege) sind vor allem Browser-Layout.
- **Offline**: Service Worker mit Vorab-Zwischenspeicher der App-Dateien (`vite.config.js`, `workbox`); neue Version erscheint als «Jetzt laden».

## 10. Häufige Stolpersteine (Stand 5.11.2026)

- **`npm ci` fehlt** in einer frischen Sitzung: zuerst ausführen, sonst «ERR_MODULE_NOT_FOUND».
- **Konflikte in heissen Dateien**: `Me`, `nav/App`, `Home`, `Tour.svelte`, `Flow`, `Live.svelte`, `de/index.js`, `app.css`, `db.js`. Eigenen Text in eine eigene Datei legen statt in eine gemeinsame Liste.
- **Verteilung der Zuständigkeiten**: Heute = `Home.svelte` und `src/lib/home`; Tour-Auswertung = `Tour.svelte`; Aktiv = `Aktiv` und `Analyse`; Live Navigation = `Live.svelte`.
- **Überraschungen hinter «PG»**: neue Überraschung in `ANY_SURPRISE` und `SURPRISES` (`tests/e2e/logo-helpers.js`) eintragen.
- **Neue Kacheln** schieben Funktionen unter die Grenze «2,5 Handy-Seiten» und machen `heimat.spec` rot: als Kachel eintragen.
- **Zwei News-Dateien in einem PR** = doppelte Version, `whatsnew.test` rot.
- **Force-Push** kann verboten sein: den Remote-Branch mit `git merge -s ours origin/<branch>` abgleichen, dann normal pushen.
- **Open-Meteo, Landi, SRF** sind von der Entwicklungsumgebung aus nicht erreichbar: geprüft wird mit erfundenen Daten, die echte Seite prüft Noah.
- **Bekannte wacklige Tests** (einzeln grün, unter Last manchmal rot): `wohl.spec`, `strava.spec`, `au` A-U5/A-U2 (Handy), `tages-check-seiten`, `sync.test`, `guard` (Handy, Gruppen), `poipanel`, `ausruestung`, `wardrobe045`, `packen-design` (Computer), `daumen`, `handy-kurz`, `erkenntnisse.spec`, `abfragen.spec`, `ausprobieren.spec` (10-Minuten-Grenze), `minitools`, `pf.spec`, `heimat.spec` (Notizen), `integrations.spec`, `ich-ideen.spec`, `poisearch.test` (Zeitüberschreitung), `docs.spec` (lokal, PDF-Fenster). Ein einzelner Rot-Fall, der allein grün ist, ist kein Grund für eine Änderung am Test; zweimal gleich rot schon.
- **Vercel-Rate-Limit rot** blockiert nichts.
- **PR-Branch zu alt** macht Tests rot: Lage prüfen, wie in 7 beschrieben nachziehen.

## 11. Regelmässige Pflege (für Mensch oder KI)

| Wann | Was |
|---|---|
| Nach jedem Merge | Pages grün? Bei `api/`: Server «packgen» READY? Eine Zeile «Online» |
| Täglich (von selbst) | Wächter, Live-Check, Nacht-Rundgang, Volle Prüfung, Dependabot |
| Bei einem roten Issue von GitHub | Das Issue lesen, Ursache beheben (nie Tests lockern), «zurück» bleibt möglich |
| Wöchentlich (Sonntags-Brief) | Kurs-Check gegen `docs/vorhaben.md`; [Stand und Plan](stand-und-plan.md) nachführen; offene PRs sichten |
| Bei 90 % Start-Grösse | Noah entscheidet: Texte hinter `import()` oder Grenze mit Begründung anheben |
| Nach Dependabot-Updates | nichts, wenn grün; bei rot beheben |

Wo man weiterlesen kann: [Aufbau](aufbau.md) für die Sicht von aussen, `docs/architecture.md` und `docs/daten.md` für den alten Stand der Packlisten-Arbeit (Anfang Oktober), [Prüfregister](verification.md) für den Nachweis älterer Prüfungen.
