# Kern verkleinern: deutsche Texte in eigenen Dateien

PR folgt · 30.10.2026 · Auftrag: Noah «ich möchte 1 umsetzen. zudem 2» und «wir lassen es bei 3MB» (Thread «Kern der App verkleinern»)

## Was ist neu
- Nichts Sichtbares. Der Kern der App war fast ganz die deutsche Wörterliste (2,99 von 3,00 MB) und stand vor dem Wächter-Stopp.
- Die deutschen Texte liegen jetzt in vier Dateien von je rund 0,5–0,8 MB (`de-texts-*.js`). Die grösste Datei der App ist jetzt `heic2any` (1,35 MB), der frühere Kern `main` hat noch 0,6 MB.
- Läuft die App auf Deutsch, werden die Dateien vor dem ersten Bild geladen (aus dem Offline-Speicher). Auf Englisch laden sie leise nach dem Start, weil Velo-Blatt und Ausrüstungs-Import deutsche Wörter brauchen.
- Der Sprachwechsel `setLang('de')` wartet, bis die Texte da sind.
- Grenze (3 MB) und Wächter bleiben unverändert (Noah «wir lassen es bei 3MB»).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Teilung mit `codeSplitting` und `maxSize: 1_000_000` in `vite.config.js`, ohne neue Abhängigkeit.
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
