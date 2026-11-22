# Leere Kachel nennt die fehlende Quelle (Regel)

PR #… · 07.11.2026 · Auftrag: Noah «alle Vorschläge» der UI-Prüfung, Befunde A3 und I1, und «können wir hier schon etwas vorbereiten» (Thread «Absprünge in der ganzen App umsetzen»)

Dieser PR ändert nichts, was man in der App sieht. Er legt nur die Regel bereit, mit der später eine einzige Zeile («Sechs Werte warten auf Fitbit, Fitbit verbinden ›») die vielen leeren Kacheln in Auswerten und Analyse ersetzt. Keine Seite benutzt sie schon.

## Was ist neu
- `src/lib/analyse/leerquelle.js` (rein, getestet): `leerQuelle(items, connected)` macht aus den leeren Werten eine Gruppe pro Quelle (Fitbit, Strava, «Wi gaht's?», Aktiv), die grösste zuerst, mit Namen, Seite der App und den Schlüsseln der betroffenen Werte. `leerSumme` zählt sie. Eigene Berechnungen und schon verbundene Quellen machen keine Gruppe.
- Test `tests/leerquelle.test.js`.
- Die Zeile selbst (mit Text, Deutsch, Bildern) kommt mit dem Seiten-PR, wenn die Datenquellen-Seite steht (A3 und I1).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur Beobachtung: die Regel sagt nur, wo etwas fehlt, und rät nichts zur Gesundheit.
- Ein leerer Wert einer verbundenen Quelle (noch kein Tag) macht keine Gruppe, weil es nichts zu verbinden gibt.
- Dieselbe Regel nimmt später der Hinweis «Du könntest Fitbit verbinden» (Rang 12–20).
- Keine «Was ist neu»-Datei und keine Funktion in `features.js`, weil noch nichts Sichtbares entsteht.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: A3 und I1 vorbereitet (Regel), der Einbau folgt nach der Datenquellen-Seite.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts Sichtbares: die App sieht aus wie vorher.
