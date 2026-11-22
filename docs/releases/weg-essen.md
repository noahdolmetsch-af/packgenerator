# Weg zum Ziel: Schrittart «Verpflegung testen»

PR # · 07.11.2026 · Auftrag: Noah «1a 2a 3a» vom 05.11.2026 (Thread «Weg zum Ziel: Verpflegung testen»)

## Was ist neu
- Nichts Sichtbares. Es entsteht die Schrittart «Verpflegung testen» (Typ `essen`) für «Weg zum Ziel»; die Seite dazu folgt (K2).
- `src/lib/weg/types/essen.js` und eine Zeile in `src/lib/weg/types/index.js`. Drei Schritte, alle änderbar, jeder mit fester Kennung `key`:
  - **Verpflegungsplan machen** (`plan`), 28 Tage vor dem Start. Haken von selbst, sobald ein Verpflegungsplan da ist (eigene Werte oder Produkte unter `#/trips/fuel`, oder eigene Werte einer Tour).
  - **Verpflegung auf einer langen Fahrt testen** (`test`), 14 Tage vor dem Start. Haken von selbst nach einer Velofahrt von 3 Stunden Fahrzeit oder mehr (Strava oder hochgeladene Fahrt), die nach dem Anlegen des Wegs und vor dem Starttag liegt, sobald der Plan da ist. Der Schritt nennt den Steigerungs-Tipp «langsam steigern, zum Beispiel von 40 auf 60 g Kohlenhydrate pro Stunde»; `tipOf()` liefert Start und deine eigene Zahl für die Seite. Nur ein Vorschlag, der Verpflegungsplan bleibt unverändert.
  - **Festhalten, was geklappt hat** (`note`), 10 Tage vor dem Start. Haken von selbst, sobald ein Erfolgsrezept mit Eintrag bei «Verpflegung» da ist, das seit dem Anlegen des Wegs entstand. Der Link führt zu den Erfolgsrezepten (`#/pack/templates`).
- `load(db)` liest, was `auto` braucht (Verpflegungsplan, Touren, Velofahrten, Erfolgsrezepte); die Seite legt es unter `ctx.essen` ab.
- `src/lib/i18n/de/weg-essen.js`: die deutschen Texte.
- `tests/weg-essen.test.js`: 16 Tests (Tage, Haken von selbst mit Grenzfällen, unklare Daten, `load` mit Datenbank, Deutsch).

## Was fällt weg oder rutscht tiefer
- nichts (keine Oberfläche)

## Selbst entschieden
- Der Eintrag `fuel` hat keinen Zeitstempel. «Nach dem Plan» heisst deshalb: der Plan ist da (oder der Plan-Schritt ist abgehakt) und die Fahrt liegt am oder nach dem Tag, an dem der Weg angelegt wurde. So lösen alte Fahrten und alte Rezepte keinen Haken aus.
- Die Fahrt am Starttag selbst zählt nicht als Test (das ist das Ereignis).
- Fehlt der Seite ein Teil der Daten (zum Beispiel noch keine Fahrten geladen), antwortet die Schrittart «unbekannt» und hakt nichts ab. Nur «keine Fahrt» ist ein klares Nein.
- Keine Zeile in `docs/app-stand.md`, keine Zeile in `features.js` und keine News-Datei: es gibt noch nichts zu sehen, und die Zeile «Weg zum Ziel» gehört dem Seiten-Thread. Seite, Absprung, Gut zu wissen, Leere Ansicht und Als Nächstes (Fertig-Regel) kommen mit der Seite.
- `weg.js` bleibt unverändert. Damit ein Weg aus einer Vorlage die Haken von selbst behält, muss `templateOf` das Feld `key` mitnehmen (kommt mit K2, siehe Auftrag).
- Die deutschen Texte liegen nur in der neuen Datei; `de/index.js` bleibt unberührt (`auto.gen.js` liest neue Dateien selbst ein).

## Entscheide (für decisions.md)
- 05.11.2026: Verpflegung testen mit drei Schritten (28/14/10 Tage vor dem Start), Haken von selbst und Steigerungs-Tipp als Vorschlag (Noah «1a 2a 3a»). Steht schon in `notes/weg-zum-ziel-2026-11-05/README.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G «Weg zum Ziel»: Schrittart 7 (Verpflegung testen) gebaut, sichtbar erst mit der Seite. `docs/roadmap.md` und `docs/vorhaben.md` ändern sich erst mit der Seite.

## Prüfschritte
Nichts zu prüfen auf der Seite. Die Tests laufen auf GitHub (build, e2e desktop).
