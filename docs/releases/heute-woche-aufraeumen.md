# Heute und Diese Woche aufräumen

Noah 23.11.2026 05:05–05:12 («was fällt dir bei heute auf?» … «ja»), ein PR für beide Seiten. Bilder vorher und nachher: `/mnt/project-files/bilder/prototyp-2026-11-23/`

## Was ist neu
- **Heute in drei Teilen:** «Jetzt» und «Deine Woche» stehen offen. Alles andere (Dein Körper, Unterwegs und Velos, Schnell öffnen, Entdecken mit Spruch, Traum der Woche und Tipp) steht unter einer zugeklappten Zeile **«Mehr»**, die die Namen der Bereiche nennt. Das Gerät merkt sich, ob sie offen ist.
- **Doppeltes weg:** das Wetter steht einmal (im Gruss), nicht nochmals im Bild der Tour; «Dein Körper heute» hat keine zweite Zeile «Wi gaht's?», solange die Kachel «Heute-Check» da ist; der Streifen «Weitermachen» steht nicht nochmals, wenn «Meine Tour» dieselbe Tour zeigt.
- **«Guät Nacht» nur bis 04:59:** der Morgen beginnt um 05:00 (eine Uhr für die ganze App, `src/lib/dayclock.js`; die Nachtruhe endet dadurch auch um 05:00).
- **Diese Woche:** die Hilfe steht einmal («Was du hier tun kannst»), «So geht's» nicht nochmals darunter. «Woche abschliessen» ist eine zugeklappte Zeile mit «4 alte Punkte». «Passt hier» ist eine zugeklappte Zeile am Seitenende («Alle Funktionen von Woche» ist es schon). Steht mehr Zeit in der Woche als im Wochenplan, sagt eine Zeile wie viel («16 h 06 sind 6 h 06 mehr als die 10 h deines Wochenplans») und nennt die längste offene Einheit. Ein Kalendertermin, der nur die Tour kopiert («Tour: …»), steht nicht zusätzlich zur Tour. Namen von Kalenderterminen werden nicht mehr bei 80 Zeichen gekürzt.

## Was fällt weg oder rutscht tiefer
- Auf Heute rutschen unter «Mehr» (alte Stelle → neue): Spruch, Entdecken und Traum der Woche (waren in «Jetzt»); «Dein Körper heute», «Aktiv heute», VO2max und die Körperwerte; Strava, Velo im Monat, Velos, Jahr; «Schnell öffnen» (die angepinnten Seiten); «Neu» und der Tipp der Woche. Ein Tipp auf «Mehr» öffnet alles wieder; die Kacheln selbst, ihre Reihenfolge, Grösse und «Kachel hinzufügen» bleiben.
- «Deine Woche» steht jetzt vor «Dein Körper».
- Das Wetter im Bild der Tour: weg (steht im Gruss und unter «Wetter heute»).
- Die zweite Zeile «Wi gaht's? am Morgen: nichts offen» in «Dein Körper heute»: weg (die Kachel «Heute-Check» sagt dasselbe; ohne sie bleibt die Zeile).
- Der Streifen «Weitermachen» bei dieser Tour: weg (steht als «Weiter mit …» in «Meine Tour»); für eine andere Tour und die Abendzeilen bleibt er.
- Woche: «So geht's» (Einstieg der Seite): weg, der Inhalt steht im «?»-Fenster. «Woche abschliessen» (alte Punkte) und «Passt hier»: eine Tippfläche tiefer, zugeklappt.
- Das Doppel «Tour: …» im Kalender der Woche: weg (der Termin bleibt in Google, nur die Kopie der Tour wird nicht nochmals gezeigt).

## Selbst entschieden
- Die Bereiche haben dieselben Schlüssel wie vorher, darum bleiben eigene Namen und «Bereiche anpassen» gültig; nur die Standard-Reihenfolge ist neu (Woche vor Körper).
- Beim Anpassen der Startseite (Bearbeiten) steht weiter die flache Liste aller Kacheln; «Mehr» gibt es nur in der normalen Ansicht.
- «Aktiv heute» steht unter «Mehr» und nicht in «Jetzt»: die Gewohnheiten und Challenges oben sind die eine Abhak-Liste; eine eigene gemeinsame Liste für Challenges und Gewohnheiten ist ein grösserer Umbau und kommt als eigener PR.
- Die Zeile «1 verpasst» der Challenge am Tag 2 stimmt rechnerisch (gestern nicht abgehakt) und bleibt; sie ändert sich in einem eigenen PR mit dem Challenge-Text.
- Das Wochenziel «200 Velo-km» ist ein eigenes Ziel (in den Einstellungen der Woche), die App setzt es nicht von selbst; unverändert.
- Stunden: zwei Einheiten mit gleichem Namen, gleichem Tag und gleicher Dauer zählen einmal. Ob bei Noah wirklich doppelt gezählt wird, zeigt sich an seinen Daten; die Zeile «zu viel» macht es sichtbar.
- «Mehr» ist beim ersten Mal zu, auch am Computer.
- Der Wochenrückblick-Thread: seine Dateien (WeekTile, bausteine, tickfokus, Auswerten) sind unberührt.

## Entscheide (für decisions)
- «Heute in drei Teilen, Rest unter «Mehr»» (siehe decisions/heute-woche-aufraeumen.md).

## Stand im Plan
- Plan «ganze App»: Heute und Woche aufräumen gebaut (neue Zeile H1). Offen: Streichliste (14), 7a/7b, V8–V11.

## Prüfschritte (nach dem Merge, auf der echten Seite)
1. Heute öffnen: Unter «Jetzt» und «Deine Woche» steht eine Zeile «Mehr» mit den Namen der Bereiche; ein Tipp öffnet sie, ein zweiter schliesst sie, nach dem Neuladen bleibt es so.
2. Heute: Das Wetter steht nur im Gruss; «Dein Körper heute» (unter «Mehr») hat keine zweite Zeile «Wi gaht's?».
3. Woche öffnen: Unter dem Titel steht nur «Was du hier tun kannst» (kein «So geht's»); «Woche abschliessen» ist eine Zeile «4 alte Punkte», ein Tipp öffnet sie.
4. Woche: Ist mehr Zeit eingeplant als im Wochenplan, steht eine graue Zeile «… mehr als die … deines Wochenplans».
