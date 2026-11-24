# Mein Tag: Muster-Woche auf dem leeren Tag

PR # · 24.11.2026 · Auftrag: Übergabe aus «Rundgang der Stärken» (Noah «1-5a»): der Bereich `week` von «So sieht's aus» (`src/lib/firststart/sosieht.js`) kommt in den leeren Zustand von Mein Tag

## Was ist neu
- Der leere Tag in «Mein Tag» hat in der leeren Karte die ruhige Zeile «So sieht's aus» mit «Muster ansehen». Ein Tipp legt die Muster-Woche (14 erfundene Haken der letzten sechs Tage, als «Beispiel» markiert) ein; «Beispiele entfernen» (Ich › Daten und Backup) nimmt sie wieder weg.
- Die Zeile steht nur, solange die App **keinen einzigen Haken** hat. Wer die App benutzt, sieht sie an leeren Tagen nicht.

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeile steht in der leeren Karte, nie über dem Inhalt.

## Selbst entschieden
- Bedingung «noch kein Haken in der App» statt «der Tag ist leer»: sonst würde jeder leere Tag einer benutzten App das Muster anbieten.
- Das Muster kommt als eigener PR, nicht im Texte-PR (ein Thema, ein PR).
- Keine Datenänderung am Format, kein Backup betroffen; die Haken sind `flowLog`-Zeilen mit der Kennung «ex-tick-n» (PR 1664).

## Beitrag zu den Zielen (Noah 18:09) und Leitfaden
- Klarheit: wer neu ist, sieht auf dem leeren Tag, wie Mein Tag mit Daten aussieht.
- Leitfaden (`docs/leitfaden.md`): der Alltag steht mit Beispiel da, nicht als leere Seite.

## Stand im Plan
- Übergabe aus «Rundgang der Stärken» erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Mein Tag» in einer App ohne Haken: in der leeren Karte «So sieht's aus» und «Muster ansehen».
2. «Muster ansehen» tippen: Meldung «Beispiel», die Zeile ist weg.
3. «Abhaken» tippen: die Muster-Haken stehen da.
