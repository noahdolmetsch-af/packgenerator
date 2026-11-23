# «Was ist neu»: eine Datei pro PR (Reparatur)

Auftrag: Noah «du darfst aufkommende Fehler selbständig beheben» (23.11.2026, Thread «Alle Sportarten und Erholung»)

## Was ist neu
- Nichts Sichtbares. Die zwei Pull Requests «Wochenrückblick: eine Rechnung, Rhythmus und Vergleiche» und «Gym zählt 1 Stunde, Gruss-Gesichter» brachten je zwei «Was ist neu»-Dateien in einem Commit. `scripts/news.mjs` nummeriert pro Commit, darum bekamen je zwei Dateien dieselbe Version und `version-at-merge.test.js`, `whatsnew.test.js` und `wasneu.test.js` wurden rot.
- Jetzt gibt es pro PR eine Datei: `wochenrechnung.js` (Rechnung + Rhythmus) und `gruss-skala.js` (Gruss-Gesichter + Gym). `wochenrhythmus.js` und `gym-eine-stunde.js` fallen weg, ihre Texte stehen in den zwei Dateien.

## Was fällt weg oder rutscht tiefer
- nichts (die Texte der beiden gelöschten Dateien stehen in den verbleibenden).

## Selbst entschieden
- Die Release- und Entscheiddateien der beiden Schritte bleiben einzeln stehen (sie sind reine Doku, nichts nummeriert sie).
- Lehre: ein PR bringt höchstens eine Datei in `src/lib/news/`.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Was ist neu: «Deine Woche, einheitlich gezählt und verglichen» und «Dein Gesicht ist eine Stimmungs-Antwort, Gym zählt eine Stunde» stehen je einmal da.
