# Tests «Inspiration» und «Neuland»: zwei Fehlschläge auf main behoben

PR #<Nummer> · 24.11.2026 · Auftrag: Nacht-Lauf 24.11. (Thread «Wackel-Tests zuverlässig machen»; `inspiration.spec.js:74`, `neuland.spec.js:48`)

## Was ist neu
- Nichts in der App.
- `inspiration.spec.js`: die Seitenleiste nennt «Touren» jetzt mit dem Zusatz «1 Tour mit offener Packliste» (die Tour ist im Test offen). Der Test prüft, dass der Ort mit «Touren» beginnt, statt den ganzen Text gleichzusetzen.
- `neuland.spec.js`: nach «Rückgängig» bleibt die ältere Meldung «Umbenannt» stehen, solange der Zeiger auf ihr ist, und deckt «Fertig» zu. Der Test nimmt die Maus weg, bevor er «Fertig» tippt (wie schon in `touren-aufraeumen.spec.js`).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nichts gelockert: derselbe Ort wird geprüft, derselbe Klick wird gemacht.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App nichts zu prüfen.
