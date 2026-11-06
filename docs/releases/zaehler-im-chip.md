# Zahl im gewählten Chip lesbar

Auftrag: Noah 06.11.2026 «5a» (Frage 5 im Etappenbericht 6, hellgraue Kleintexte), Befund E6-012 (Klasse C).

## Was ist neu
- Beim Nachmessen zeigte sich: die Grundfarbe der Zusatztexte (`--ink-3`) liegt in jeder Palette bei 5,2 : 1 oder mehr auf ihrer Fläche und bleibt darum, wie sie ist. Der echte Fehler war die kleine Zahl im **gewählten** Chip einer Chip-Reihe (zum Beispiel Neuland): sie behielt das Grau der nicht gewählten Chips und stand auf der dunklen Füllung bei 2,6 : 1 (hell) und 1,9 : 1 (dunkel).
- Die Zahl im gewählten Chip erbt jetzt die Schriftfarbe des Chips (leicht abgedunkelt): über 4,5 : 1 in beiden Modi.
- Die übrigen Treffer der Messung (ausgegraute Knöpfe, Texte während des Einblendens) waren keine Fehler.
- Test `tests/e2e/seg-zaehler-kontrast.spec.js` (Neuland, hell und dunkel, erfundene Daten): rot ohne Fix (2,64 und 1,92), grün mit Fix.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Keine Änderung der Grundfarbe: sie erfüllt 4,5 : 1 schon. Wenn du sie trotzdem dunkler willst, ist das eine Zeile pro Palette.
- Keine neuen Texte, keine neue Funktion: keine Änderung in `docs/app-stand.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick Etappe 6: Frage 5 beantwortet und umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Neuland öffnen: der gewählte Sammlungs-Chip zeigt seine Zahl in hellen Buchstaben.
2. Dunklen Modus einschalten (Ich › Aussehen): die Zahl bleibt lesbar.
