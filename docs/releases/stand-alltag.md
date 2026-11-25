# Dein Stand in Zahlen auf Alltag

25.11.2026 · Auftrag: Noah (Wahl «Alltag» auf der Entscheid-Karte; Thread «Mini-Landingpage pro Bereich bauen»)

## Was ist neu
- Auf Woche › Alltag steht jetzt die Karte «Dein Stand in Zahlen»: drei grosse Zahlen (Tage in Folge draussen, offene Punkte der Einkaufsliste, Tage bis zur nächsten Frist eines Vertrags). Jede führt dorthin, woher sie kommt (Challenges, Einkaufsliste, Verträge und Abos).
- Darunter «Minuten draussen pro Tag, die letzten 14 Tage» auf dem gemeinsamen Balkendiagramm, solange die Challenge «Draussen» läuft (am Computer neben den Zahlen und offen, am Handy eine geschlossene Zeile). Läuft keine, steht ein Satz, wie man sie startet.
- Dasselbe «Ausblenden» (mit Rückgängig) und derselbe Schalter unter Ich › Darstellung › Bedienung wie bei Velos und Material; er gilt für alle Bereiche.
- Verträge zeigen nur Tage, nie einen Betrag.

## Was fällt weg oder rutscht tiefer
- Die Liste «Einkaufsliste, Verträge und Abos, Lange nicht gesehen, Kochen» rutscht auf Woche › Alltag um die Höhe der Karte nach unten. Nichts fällt weg.

## Selbst entschieden
- **Welche Zahlen:** Alltag hat keine einzelne Kennzahl; gewählt wurden die Zahlen, die dort wirklich laufen: die Challenge «Draussen» (gleiche Zählung wie auf Heute, `standing` in `src/lib/outdoor.js`), die offenen Punkte der Einkaufsliste und die Tage bis zur nächsten Frist (`deadlineOf` in `src/lib/alltag.js`).
- **Lesart «Alltag»:** der Reiter «Alltag» im Ort Woche (Einkauf, Verträge, Menschen, Kochen). Heute, Challenges und Mein Tag haben ihre eigenen Seiten und bleiben unberührt.
- **Keine Beträge:** Verträge nur als Tage.
- **Ohne Challenge:** die erste Zahl zeigt «–», der Verlauf fehlt, ein Satz sagt, wie man «Draussen» startet.
- Karte steht unter dem Einleitungssatz der Seite und vor der Liste der Helfer (Inhalt zuerst, wie bei Velos).
- Kein Eintrag in `features.js`: derselbe Baustein wie bei Velos, keine eigene Seite; jede Zahl ist selbst ein Absprung.

## Entscheide (eigene Datei `docs/decisions/stand-alltag.md`)
- 25.11.2026: Alltag als zweiter Bereich für «Dein Stand in Zahlen».

## Stand im Plan (roadmap.md / vorhaben.md)
- Mini-Landingpage pro Bereich: Velos und Material und Alltag sind gebaut; die anderen Bereiche folgen einzeln.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Woche › Alltag öffnen: oben drei Zahlen, direkt darunter die Liste der Helfer.
2. Eine Zahl antippen: sie führt zu den Challenges, zur Einkaufsliste oder zu den Verträgen.
3. Am Handy die Zeile «Minuten draussen pro Tag» antippen: das Diagramm klappt auf.
4. «Ausblenden» tippen, dann «Rückgängig».
