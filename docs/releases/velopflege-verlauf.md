# Verlauf mit Kosten

PR folgt · 21.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Velopflege zum Inspektions-Begleiter machen»), Schritt D von A–E

## Was ist neu
- Auf der Pflege-Seite eines Velos steht unter der Teile-Tabelle die Karte «Verlauf» (`src/lib/care/VerlaufCard.svelte`): Werkstatt-Besuche und Service, fertige Checks und die Teile, die du selbst ersetzt oder gewartet hast, in einer Liste, das Neueste zuerst, mit dem Preis. Zugeklappt sind es die neuesten drei Einträge.
- «Ganzer Verlauf» zeigt alle Einträge mit Filter (Alle, Service, Checks, Teile), Jahres-Wahl und der Summe des Filters. Auf dem Handy zeigt die Liste zuerst 5 Zeilen und dann «weitere zeigen».
- Die Summe eines Jahres ist dieselbe Zahl wie «Kosten» in «Auf einen Blick» (gleiche Preise, gleiche Rechnung; ein Test prüft das).
- Die Kachel «Kosten» in «Auf einen Blick» hat den Knopf «Verlauf ansehen»: öffnet den Verlauf und scrollt hin.
- Leer sagt die Karte, warum sie leer ist, und führt zu den Inspektionen.
- Rechnung `src/lib/care/verlauf.js` (reine Funktionen, `tests/verlauf.test.js`): nichts wird gespeichert, alles kommt aus Besuchen, Teile-Verlauf und Inspektionen.

## Was fällt weg oder rutscht tiefer
- Nichts. Das Logbuch («Log: everything that was done») unter «Mehr»-Zeilen bleibt unverändert, mit allen Einzelheiten (Messwerte, Wäschen, einzelne Teile-Checks). Der Verlauf ist die kurze Fassung mit den Kosten.

## Selbst entschieden
- Der Verlauf steht sichtbar auf der Seite (nicht unter «Mehr»), weil Kosten und letzter Service oft gebraucht werden. Er ist eine Karte mit Aufklappen an Ort und Stelle, keine eigene Seite: so bleiben Zurück-Knopf und Adresse wie sie sind.
- Ein Besuch zählt einmal (mit dem Total der Rechnung), nicht nochmals als die einzelnen Teile-Einträge, die er mitbringt. Reine Messwerte, einzelne Teile-Checks, Wäschen und «Arbeit nötig» sind keine Zeilen (sie stehen im Logbuch).
- «Eintrag nachtragen» aus dem Entwurf ist nicht in diesem Schritt: Nachtragen geht schon über die Teile-Tabelle («Ersetzt oder erledigt») und «Werkstatt und Belege». Der Knopf «Werkstatt & Belege» steht unter dem Verlauf. Falls du einen eigenen Knopf willst, ist es ein kleiner Folge-PR.
- Keine neue Datenhaltung, kein Backup-Format, kein `api/`. Fertig-Regel: Seite (besteht), Absprung (Kosten-Kachel), Leerzustand (ja), nächster Schritt (Link zu den Inspektionen), App-Stand (Zeile erweitert).

## Entscheide (für decisions.md)
- 21.11.2026: Service, Checks und Teile mit Kosten stehen in einem Verlauf pro Velo, mit Filter und Summe pro Jahr (Noah «1a 2a 3a 4a 5a», Frage 3a).

## Stand im Plan (roadmap.md / vorhaben.md)
- Velopflege-Begleiter: Schritte A bis D gebaut, E offen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos › Pflege: unter der Teile-Tabelle steht «Verlauf» mit den neuesten drei Einträgen und Preisen.
2. «Ganzer Verlauf» antippen, Filter «Service» wählen: nur die Werkstatt-Besuche, mit Summe.
3. Bei «Auf einen Blick» auf «Verlauf ansehen» tippen: der Verlauf öffnet sich; die Summe des Jahres ist dieselbe wie bei «Kosten».
