# Kern verkleinern: deutsche Texte in eigenen Dateien

PR folgt · 30.10.2026 · Auftrag: Noah «ich möchte 1 umsetzen. zudem 2» und «wir lassen es bei 3MB» (Thread «Kern der App verkleinern»)

## Was ist neu
- Nichts Sichtbares. Der Kern der App war fast ganz die deutsche Wörterliste (2,99 von 3,00 MB) und stand vor dem Wächter-Stopp.
- Die deutschen Texte liegen jetzt in vier Dateien von je rund 0,6–0,7 MB (`de-texts-1…4`, nach dem Anfangsbuchstaben der Datei). Die grösste Datei der App ist jetzt `heic2any` (1,35 MB), der frühere Kern `main` hat noch 0,6 MB.
- Läuft die App auf Deutsch, lädt `main.js` zuerst die Texte und dann erst die App (`start.js`, der frühere Inhalt von `main.js`); so sind auch Texte, die ein Teil beim Laden baut, schon Deutsch. Die Texte kommen aus dem Offline-Speicher. Auf Englisch laden sie leise nach dem Start, weil Velo-Blatt und Ausrüstungs-Import deutsche Wörter brauchen.
- Der Sprachwechsel `setLang('de')` wartet, bis die Texte da sind.
- Grenze (3 MB) und Wächter bleiben unverändert (Noah «wir lassen es bei 3MB»).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Teilung mit vier `codeSplitting`-Gruppen in `vite.config.js` (ohne `maxSize`: das liess ein Teil beim Zusammenbau verschwinden, weil die Dateien im Kreis voneinander abhingen). `index.js` und `auto.gen.js` bleiben ausserhalb der Gruppen; `vo2heute` liegt bei `heuteruhiger`.
- `tests/e2e/placetab.js` (`tapTab`) wartet, bis die Seitenleiste da ist, weil die App einen Moment nach dem Laden erscheinen kann.
- Wächter `swissnum`/`look` lesen jetzt `src/start.js`.
- Unit-Tests laden die Texte über `tests/setup/de.js` vor.
- `gearimport.js` baut seine Kategorie-Wörter beim ersten Gebrauch (nicht mehr beim Laden), weil die Texte später kommen.
- Keine «Was ist neu»-Datei, da nichts sichtbar ist.

## Entscheide (für decisions.md)
- 30.10.2026: Grenze bleibt bei 3 MB; wächst die Wörterliste, teilt sie sich in weitere Dateien (Noah «wir lassen es bei 3MB»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Kein Plan geändert (Wartung, dient «Eine App, die mich im Alltag unterstützt»: schneller, stabiler Bau).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. App auf Deutsch öffnen: alle Texte sind Deutsch, nichts Englisches auf Heute.
2. Ich › Sprache auf English und zurück auf Deutsch stellen: beides wechselt sofort.
3. Zum Velo-Blatt gehen: Wörter wie «Kette» stehen auf Deutsch.
