# Zwiebel für Morgen und Mittag, Kleider-Frage im Rückblick

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «1-5a 4b» (Thread «Kleiderschrank wieder ins Zentrum rücken»), Koordinator: a und b zusammen in einem PR

## Was ist neu
- Zwiebel in der Packliste: im geöffneten Teil wählt «Die Zwiebel für» zwischen «Kälteste Stunde» (wie bisher), «Morgen» und «Mittag» des ersten Fahrtags. Zeilen, Lücken und das Kit richten sich nach der Wahl. Die Auswahl erscheint nur, wenn Morgen oder Mittag von der kältesten Stunde abweicht.
- Rückblick: die Frage «Wie war die Kleidung?» (zu kalt, passte, zu warm) steht jetzt offen in der rechten Spalte statt im Aufklapper «Wie war es?». Die Antwort wirkt wie bisher: sie verschiebt langsam die Grenzen deiner Temperatur-Kits.

## Was fällt weg oder rutscht tiefer
- Die Zeile «Kleidung» ist nicht mehr unter «Mehr › Wie war es?», sondern oben rechts als eigener Abschnitt (sie rutscht nach oben, nichts fällt weg). Die Untertitel des Aufklappers heissen nun «Wetter, Essen, km» und «Wetter, Essen, Taschen».

## Selbst entschieden
- Morgen = die erste Fahrstunde des ersten Fahrtags, Mittag = die wärmste Stunde zwischen 11 und 15 Uhr. Ohne Stundenwerte zählt das Packwetter: Minimum als Morgen, Maximum als Mittag.
- Die Wahl wird nicht gespeichert; beim Öffnen der Seite gilt wieder die kälteste Stunde (die sichere Seite).
- «Wie war die Kleidung?» steht bei jeder Tour, auch wenn kein Kleidungsstück auf der Liste war: man hat trotzdem etwas getragen.
- Kein Schema, kein Backup, kein Sync, kein api/.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Packliste einer geplanten Tour mit Wetter öffnen, «Zwiebel: …» antippen, unter «Die Zwiebel für» «Mittag» wählen: die Zeilen ändern sich.
2. «Kälteste Stunde» wählen: wieder wie vorher.
3. Rückblick einer Tour öffnen: «Wie war die Kleidung?» steht rechts offen; «Zu kalt» antippen.
