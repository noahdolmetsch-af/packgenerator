# Mein Tag: Tagesvorlagen und Wiederholen

PR # · 25.11.2026 · Auftrag: Noah «1-3» (25.11.2026 00:08, Idee 3 von drei; Thread «Neue Seite «Mein Tag» bauen»)

## Was ist neu
- **Tagesvorlagen:** In «Tag planen lassen» gibt es den Knopf «Tagesvorlagen». Das Fenster merkt die **eigenen Einträge** des Tages (Termine und To-dos aus «Eintrag hinzufügen») unter einem Namen («Arbeitstag»). Eine Vorlage lässt sich **auf diesen Tag** oder **auf mehrere Tage** (die nächsten 14) legen, oder löschen. Alles mit «Rückgängig».
- **Jede Woche wiederholen:** Im Eintragsfenster wählt man «Nicht», «4 Wochen» oder «8 Wochen». Die App kopiert den Eintrag auf den gleichen Wochentag der folgenden Wochen, mit «Rückgängig».
- Vorlagen und Kopien sind **gewöhnliche eigene Einträge**: man kann jeden einzeln ziehen, ändern oder löschen. Was an einem Tag schon steht (gleicher Name, gleiche Zeit), wird nicht doppelt angelegt (`src/lib/tag/vorlage.js`).

## Was fällt weg oder rutscht tiefer
- Nichts. Neu ist ein Knopf im bestehenden Fenster «Tag planen lassen» und ein Feld im Eintragsfenster; der Tag selbst bleibt unverändert.

## Selbst entschieden
- Wiederholen heisst **echte Kopien für 4 oder 8 Wochen**, keine versteckte Regel «jeden Dienstag». So bleibt jeder Termin sichtbar und einzeln änderbar, und nichts läuft unbemerkt weiter. Nach den Wochen kann man neu wiederholen (die App legt nichts doppelt an).
- Eine Vorlage enthält nur eigene Einträge. Google-Termine, TrainingPeaks und Trainingsplan gehören ihren Quellen.
- Gleicher Name gleich einer bestehenden Vorlage ersetzt diese, statt zwei gleiche zu halten (Gross/Klein egal).
- **Daten:** neue Einstellung `week.templates` (eine Liste, höchstens 20 Vorlagen mit je 30 Einträgen); sie reist in jeder Sicherung mit, wie `week.items`. Kein neuer Speicher, keine Änderung an bestehenden Einträgen.
- Zusätzlich null-sichere `dialog?.close()` in den drei Fenstern (Eintrag, Tag planen, Vorlagen): sonst gab es einen Seitenfehler, wenn ein Fenster beim Speichern schon weg war.

## Beitrag zu den Zielen und Leitfaden
- Klarheit: ein gut gelaufener Tag wird zur Vorlage, die Wiederholung zeigt sich als echte Einträge.
- Auffindbarkeit: der Einstieg steht dort, wo man den Tag plant («Tag planen lassen»), und im Eintrag selbst.
- Leitfaden (`docs/leitfaden.md`): weniger tägliches Neu-Planen, ohne etwas zu verstecken.

## Stand im Plan
- Idee 3 von 3 (Noah «1-3»). Offen danach: Schritt 5 (Mein Tag ersetzt Woche und Kalender) und Schritt 6 Rest (Sportarten an/aus).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Tag planen lassen» › «Tagesvorlagen»: heute unter einem Namen merken.
2. «Auf mehrere Tage …»: zwei Tage anhaken, «Auf 2 Tage legen»; «Rückgängig» nimmt sie weg.
3. Einen Eintrag öffnen, «4 Wochen» wählen, speichern; vier Wochen später steht die Kopie.
