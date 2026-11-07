# Weiter von hier (Baustein)

PR #… · 07.11.2026 · Auftrag: Noah «alle Vorschläge» der UI-Prüfung, Befund Q1, und «können wir hier schon etwas vorbereiten» (Thread «Absprünge in der ganzen App umsetzen»)

Dieser PR ändert nichts, was man in der App sieht. Er legt nur den Block bereit, der später die Wegweiser-Reihen «Passt hier» und «Als Nächstes» zu einem einzigen Block «Weiter von hier» zusammenführt. Keine Seite benutzt ihn schon, und es wird noch nichts ersetzt.

## Was ist neu
- `src/lib/weitervon.js` (rein, getestet): `weiterVon({ place, moment, also }, notForMe)` fügt zusammen, was `PASST_HIER` (passt zu diesem Abschnitt) und `ALS_NAECHSTES` (passt direkt nach einer Handlung) schon sagen, dazu Funktionen, die die Seite selbst nennt. Jede Funktion steht einmal, «Nicht für mich» bleibt draussen, höchstens sechs.
- `src/lib/ui/WeiterVon.svelte`: der Block mit der Überschrift «Weiter von hier» und kleinen Knöpfen, ein Tipp springt zur Funktion (wie «Passt hier»).
- Deutscher Text in `src/lib/i18n/de/weiter-von.js`, Test `tests/weitervon.test.js`.

## Was fällt weg oder rutscht tiefer
- nichts (die Reihen «Passt hier» und «Als Nächstes» bleiben, wie sie sind; sie werden erst im späteren Seiten-PR ersetzt)

## Selbst entschieden
- Keine «Was ist neu»-Datei und keine Funktion in `features.js`, weil noch nichts Sichtbares entsteht.
- Es gibt keine zweite Liste: der Block liest nur `PASST_HIER` und `ALS_NAECHSTES`, damit nichts doppelt gepflegt wird und `tests/absprung.test.js` unverändert gilt.
- «Alles hier» (die ordnungsfähige Kachelreihe oben auf einer Bereichsseite) wird nicht mit hineingezogen; sie bleibt eigene Karte.
- Abgestimmt mit dem Skizzier-Thread: sein Ort-Vorlage-Band «Passt hier» nimmt diesen Block, nicht einen zweiten.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: Q1 vorbereitet (Baustein), der Einbau in die Seiten folgt als letzter Schritt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts Sichtbares: die App sieht aus wie vorher.
