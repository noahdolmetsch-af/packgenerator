# Dunkler Modus: wieder lesbar

Auftrag: Noah 05.11.2026, Durchklick Etappe 6 (Querschnitt, Dunkelmodus), Befunde E6-005 und E6-006 (Klasse C).

## Was ist neu
- Kochen: «Frühstück», «Zmittag», «Abendessen» und «Ändern» standen im dunklen Modus fast schwarz auf dunkel (Kontrast 1,1 : 1). Sie nehmen jetzt die Kopffarbe der App (`--head`), wie im hellen Modus ein dunkles Grün.
- «Springen zu» (Material, Neuland, Neuigkeiten): die Zahl im gewählten Chip war hellgrau auf hell (1,9 : 1); sie erbt jetzt die Chip-Farbe.
- Dieselbe Ursache, gleich mitbehoben: die Schrittzeile im Kochmodus («Schritt 1 von 5») und das Etikett «Live» in Touren.
- E6-006 Kleider zur Tour: die orange Kopfzeile im hellen Band war im dunklen Modus 1,9 : 1; sie ist jetzt dunkel auf hell.
- Ursache: `--brand` ist eine dunkle Flächenfarbe, als Schriftfarbe taugt sie nur im hellen Modus. Neuer Wächter `tests/dark-text.test.js` (rot ohne Fix): keine Schrift mit `color: var(--brand)`, ausser zwei Symbole auf hellen runden Knöpfen.
- Test `tests/e2e/dunkel-kontrast.spec.js` (Handy, dunkel, erfundene Daten): misst die echten Farben; rot ohne Fix, grün mit Fix.

## Was fällt weg oder rutscht tiefer
- nichts. Im hellen Modus wird die Schrift an diesen Stellen etwas heller grün (Kopffarbe statt Dunkelgrün).

## Selbst entschieden
- `--head` statt `--ink`, damit die Stellen weiter grün bleiben.
- Keine neuen Texte, keine neue Funktion: keine Änderung in `docs/app-stand.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick Etappe 6: E6-005 behoben; der Rest steht im Etappenbericht.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Dunklen Modus einschalten (Ich › Aussehen), Ich › Alltag › Kochen öffnen: «Ändern» ist lesbar.
2. Im dunklen Modus Material auf dem Handy: die Zahl im gewählten Chip unter «Springen zu» ist lesbar.
