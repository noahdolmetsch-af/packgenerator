# Lange Wörter in Rennnamen und Notfallkarte

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 3, Befunde E3-004 und E3-005; Thread «Durchklicken Etappe 3: Unterwegs und Wetter»)

## Was ist neu
- Touren › Rennen › ein Rennen öffnen: Ein Rennname aus einem sehr langen Wort (ohne Leerzeichen) machte die Seite um ein Mehrfaches breiter als den Bildschirm. Der Titel bricht jetzt am Rand um.
- Berg › Notfallkarte: Die Textvorschau neben dem QR-Code brach einen sehr langen Namen nicht um und schob die Seite zur Seite. Sie bricht jetzt um.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Gleiche Ursache an zwei Stellen (langes Wort ohne Umbruchstelle), darum ein PR: `overflow-wrap: break-word` auf `.rc-h1` (`src/lib/race/race.css`, gilt für alle Rennen-Seiten) und auf `.txt` mit `max-width: 100%` (`src/pages/mountain/SosQr.svelte`; der Stil-Wächter erlaubt kein `anywhere`).
- Regressionstests: `tests/e2e/lange-woerter-rennen-notfall.spec.js` (vorher rot: Rennseite 2355 px und Notfallkarte 1448 px auf einem 390-px-Handy).
- Nicht geprüft (nur Noah): das gedruckte Kärtchen und das Sperrbild der Notfallkarte mit einem sehr langen Namen.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Touren › Rennen, lege ein Rennen an und schreibe ein sehr langes Wort ohne Leerzeichen als Namen.
2. Die Rennseite bleibt so breit wie der Bildschirm, der Titel bricht um.
3. Öffne Berg › Notfallkarte, schreibe ein langes Wort als Namen und tippe daneben: Die Vorschau bricht um.
