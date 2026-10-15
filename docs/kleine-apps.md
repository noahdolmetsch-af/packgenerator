# Kleine Apps

Stand 14.10.2026. Noah, 14.10.2026: «eigene kleinere Apps, zum Beispiel Meditation, Packliste oder Velo-Pflege und anderen»; nach der Erklärung in Worten: «verstehe. bitte freigegeben. bitte umsetzen».

## Was es ist

Die gleiche App lässt sich als kleine App mit eigenem Symbol auf dem Handy installieren. Eine kleine App öffnet direkt ihren Bereich und zeigt unten nur ihre eigenen Tabs und «Ganze App». Der Pack Generator selbst bleibt genau wie er ist.

| Kleine App | Adresse (GitHub Pages) | Startet auf | Tabs unten |
|---|---|---|---|
| Meditation | `/packgenerator/apps/meditation/` | Aktiv › Meditation | Meditation, Timer, Logbuch, Mehr, Ganze App |
| Packliste | `/packgenerator/apps/packliste/` | Touren › Packen | Packen, Touren, Vorlagen, Rückblick, Ganze App |
| Velopflege | `/packgenerator/apps/velopflege/` | Velos › Pflege | Pflege, Werkstatt, Velos, Ganze App |

## Beispiel im Alltag

Heute: Pack Generator öffnen → Aktiv → Meditation (3 Schritte). Mit der kleinen App: Symbol «Meditation» antippen, der Timer ist sofort da. Die Sitzung landet im gleichen Speicher und erscheint auch im Pack Generator unter Aktiv.

## So installierst du eine kleine App (Samsung, Chrome)

1. In Chrome die Adresse öffnen, z.B. `https://noahdolmetsch-af.github.io/packgenerator/apps/meditation/`.
2. Menü ⋮ → «App installieren» (oder «Zum Startbildschirm hinzufügen»).
3. Das neue Symbol «Meditation» liegt neben dem Pack Generator.

Am Computer (Chrome oder Edge) geht es gleich: Adresse öffnen, in der Adresszeile auf das Installieren-Symbol.

## Entscheide (aus Noahs Freigabe der Beschreibung)

- Daten gemeinsam: alle kleinen Apps nutzen den gleichen Speicher (gleiche Adresse, gleiche Datenbank). Nichts doppelt eintippen, ein Backup für alles.
- Bauweise: eine App im Hintergrund, je kleine App eine eigene Seite `apps/<key>/index.html` mit eigenem Manifest und Symbol (`public/apps/<key>/`). Kein zweites Programm.
- Die grosse App bleibt zusätzlich bestehen.
- Erste kleine Apps: die drei, die Noah genannt hat. Weitere («und anderen») kommen mit eigener Freigabe dazu.
- Bezahlfunktion: getrennt, gehört dem Thread «Bezahlfunktion» (`docs/bezahlen.md`). Kleine Apps kosten nichts.

## Technik

- `src/lib/miniapps.js`: Liste der kleinen Apps mit Tabs; erkennt die kleine App an der Adresse.
- `src/lib/nav/MiniBar.svelte`: die Leiste unten (Handy und Computer), ersetzt dort die fünf Orte und die Seitenleiste.
- `src/App.svelte`: in einer kleinen App Start auf dem ersten Tab, Name oben, keine Orte-Tabs.
- `vite.config.js`: drei weitere Seiten im Build; ein kleines Plugin lässt auf diesen Seiten nur das eigene Manifest stehen.
- `tools/miniapp-icons.mjs`: zeichnet die Symbole (`node tools/miniapp-icons.mjs public/apps`).
- Tests: `tests/miniapps.test.js`, `tests/e2e/miniapps.spec.js`.

## Weitere kleine App hinzufügen

1. Eintrag in `MINI_APPS` (`src/lib/miniapps.js`) mit Tabs.
2. `apps/<key>/index.html` (Kopie einer bestehenden, Manifest-Pfad anpassen), `public/apps/<key>/manifest.webmanifest`, Symbol in `tools/miniapp-icons.mjs`.
3. Eintrag in `vite.config.js` (`build.rollupOptions.input`).
4. Deutsche Texte in `src/lib/i18n/de/kleineapps.js`. Die Tests prüfen den Rest.

## In der App (Mockup HB2, Noah 14.10.2026 18:27 UTC «1b 2b», «hb freigeben»)

- **Ich › Die App › Handbuch** (`#/me/handbook`, `src/pages/Handbook.svelte`): alle Funktionen nach Situation, jede aufklappbar mit Aufschalten, Schritten, Beispiel und «Hinbringen». `#/me/handbook?f=<id>` öffnet eine Funktion.
- **Ich › Die App › Kleine Apps** (`#/me/apps`, `src/pages/MiniApps.svelte`): die kleinen Apps mit Symbol, Schritten zum Installieren und «Öffnen».
