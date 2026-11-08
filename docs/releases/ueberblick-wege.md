# Überblick öffnet die Analyse (Aktiv)

PR #… · 08.11.2026 · Auftrag: Noah «3a» des Entwurfs «Wege besser sichtbar» (Thread «Absprünge: Analyse und Aktiv antippbar machen»)

## Was ist neu
- Aktiv › «Überblick»: die Kacheln Herzfrequenz, Kalorien und Schlaf öffnen den Wert in der Analyse (7 Tage) statt der alten Seite.
- Die Sportkarten («Im Fokus»), der Satz «Die letzte: …» und die Zeilen unter «Letzte 7 Tage» öffnen den Kilometer-Wert der Sportart in der Analyse.
- Die alte Ansicht bleibt in der Analyse unter dem Diagramm erreichbar («Auch in der bisherigen Ansicht»).

## Was fällt weg oder rutscht tiefer
- Der Tipp auf eine Kachel führt nicht mehr direkt auf die alte Seite. Die alte Seite ist jetzt einen Tipp weiter: Analyse › «Auch in der bisherigen Ansicht».

## Selbst entschieden
- Die Kachel «Aktivzonenminuten» bleibt, wie sie ist: sie ist keine Verlinkung, sondern lässt dich das Wochenziel ändern.
- Sportkarten und Zeilen nehmen den Wert «Kilometer» der Sportart (Zeitraum 30 Tage bzw. 7 Tage), weil es dafür in der Analyse schon einen Wert gibt.
- Kein neuer UI-Text, keine neue Funktion in `features.js`.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: Verbesserung 3 (Überblick führt in die Analyse) gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › «Überblick»: auf die Kachel «Herzfrequenz» tippen, die Analyse zeigt den Ruhepuls.
2. Unter dem Diagramm «Auch in der bisherigen Ansicht» tippen: die alte Seite öffnet sich.
3. Zurück, eine Sportkarte antippen: die Analyse zeigt deren Kilometer.
