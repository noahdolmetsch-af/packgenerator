# Hinter den Kulissen: weniger Konflikte

PR #<Nummer> · 28.10.2026 · Auftrag: Bündler «Mein Überblick» (Thread «Konflikte in de/index.js beenden»)

## Was ist neu
- `src/lib/i18n/de/index.js`: die deutschen Textdateien stehen als Liste mit je einer Zeile pro Datei. Alle weiteren Dateien im Ordner `de/` werden von selbst geladen (`import.meta.glob`), nach der Liste, alphabetisch.
- Neue Regel: ein neuer Teil der App legt nur **seine eigene Datei** in `de/` an. `de/index.js` und `de/handbuch.js` werden nicht mehr verändert (kein Import, kein Spread am Ende, keine Zeile am Ende von handbuch.js).
- Inhaltlich ändert sich nichts: gleiche Reihenfolge, gleiche Texte, alle Tests grün.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die bestehende Reihenfolge bleibt fest in der Liste, nur neue Dateien kommen automatisch dazu (der Wächter `i18n-doppelt` prüft weiter doppelte Schlüssel).
- `features.js`, `handbook.js`, `moment.js`: dort wird mitten in Gruppen eingefügt, nicht am Ende; unverändert gelassen.

## Entscheide (für decisions.md)
- keine

## Stand im Plan
- nichts

## Prüfschritte
1. Heute öffnen: deutsche Texte wie vorher.
2. Ich › Was ist neu öffnen: Liste wie vorher.
