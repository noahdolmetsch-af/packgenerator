# Eine Neuigkeiten-Zeile nennt ihren Ort

PR folgt · 08.11.2026 · Auftrag: Koordinator 08.11.2026 (Pauschalfreigabe «1a»), Thread «Reparieren Konflikt Traum der Woche»

## Was ist neu
- Nichts Sichtbares in der App. Eine ältere Zeile von «Was ist neu» (`src/lib/news/ausw-aufraeumen.js`, zweiter Punkt) hat jetzt zusätzlich `where`. Ohne Daten zeigt Auswerten › Übersicht die Kacheln nicht; «Ausprobieren» (`tests/e2e/ausprobieren.spec.js`) fand dann nichts zum Aufleuchten und wurde rot.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Zeile bekommt `where` (wie bei anderen Zeilen mit Daten-Abhängigkeit) und behält ihre Schritte. Der Test und die Seiten bleiben unverändert.
- Die gleiche Lücke bei 0.317.0 (`analyse-alle-werte.js`, `[data-all]`) übernimmt der Aktiv-Thread in #1110; hier nicht angefasst.
- Gilt für jeden PR, der `src/lib/know/` berührt (dann tippt «Ausprobieren» alle Zeilen): auf einem sauberen main rot, deshalb ein eigener PR.

## Entscheide (für decisions.md)
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Was ist neu › «Auswerten: Zeiträume klarer»: Tipp auf die Zeile zu den Kacheln, sie führt zu Auswerten › Übersicht.
