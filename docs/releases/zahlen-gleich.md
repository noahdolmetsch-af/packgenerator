# Überall dieselbe Zahl

PR folgt · 08.11.2026 · Auftrag: Noah «1-5 a», Frage 4 (Thread «Bauen: Widersprüchliche Zahlen reparieren», aus dem UX-Test 08.11.2026)

## Was ist neu
Sechs Stellen, an denen dieselbe Sache zwei verschiedene Zahlen zeigte. Jede zählt jetzt nach einer Regel und sagt, was sie zählt:
1. **Heute, Backup (1-02):** Die rote Zeile sagt nur noch den Backup-Stand («Du hast noch keine Backup-Datei gespeichert»). Stammen die Daten aus einem Backup, steht das in einer eigenen gelben Zeile «Deine Daten stammen aus dem Backup vom …» mit «Zu Daten» (`src/lib/home/backuprows.js`).
2. **Heute, Tourkarte (1-03):** «Tour 1 von 8» statt «1 / 8» und «Auch in Arbeit: 9» statt «+9 weitere Touren». Die zwei Zahlen zählen Verschiedenes (Touren in der Reihe gegen alles, was in Arbeit ist) und sagen es jetzt.
3. **Touren und Rückblick (2a-04):** «n warten auf deinen Rückblick» (Touren), die Marke «Abgeschlossen» (Rückblick), «n Rückblicke fehlen» (Logbuch) und «n ohne Rückblick» (Vergangene Touren) rechnen alle mit `waitingCount` (`src/lib/review/state.js`): Abgeschlossen und noch nicht bewertet, Touren und hochgeladene Fahrten. Der Rückblick nennt unter dem Titel, wie viele der gefahrenen Einträge hochgeladene Fahrten sind.
4. **Woche (2b-02):** Die Zeile unter dem Titel zählt auch die Touren («1 Tour · 0 Einheiten · …»). Stand nur die Tour im Plan, sagt der Wochen-Abschluss das, statt «nichts geplant» (`src/lib/woche.js`, `abschluss.js`, `WeekClose.svelte`).
5. **Material (3-04):** Die Kachel «gewogen» zählt das Gerät ohne Essen und Trinken; das Essen steht klein daneben («+ 4.67 kg Essen und Trinken, nicht dabei»). So passt sie zur Zeile «nicht im Materialgewicht» (`viewSummary`: `gearG`, `foodG`).
6. **Aktiv, Ziele (G6-03):** Kopfzeile und «Heute abhaken» zählen alle Ziele der Woche («1 von 13»), wie der Wochenrückblick; die Wochenkarte zählt die offenen derselben Menge (12). Nur der Ring «Bewegen» zählt seinen Teil (10) und heisst so.

Dazu ein Wächter-Test (`tests/zahlen-gleich.test.js`): er wird rot, wenn eine dieser Stellen wieder eine eigene Regel rechnet.

## Was fällt weg oder rutscht tiefer
- «1 / 8 ›» und «+9 weitere Touren» auf der Tourkarte → «Tour 1 von 8 ›» und «Auch in Arbeit: 9».
- Der Satz «Daten aus dem Backup vom … Ist das Handy neuer?» in der roten Backup-Zeile → eigene gelbe Zeile mit neutralem Text.
- Aktiv: die Kopfzeile zählte vorher nur die Bewegungsziele («1 von 10 Bewegungszielen») → jetzt alle Ziele; die 10 steht weiter beim Ring «Bewegen».
- sonst nichts

## Selbst entschieden
- Hochgeladene Fahrten zählen überall als «wartet auf Rückblick» (die einfachste Regel aus dem Bericht; «Kurzer Rückblick» gibt es für sie schon).
- Das Fachwort «Einheiten» in der Wochen-Zeile bleibt; der Bericht schlug «Training» vor. Das ist ein Wortwechsel über mehrere Seiten, nicht Teil dieses PR.
- Die Material-Kachel ist am Handy ausgeblendet (wie vorher); dort stehen die Kategorie-Zeilen, die die Regel schon sagten.
- Eine Funktion im Katalog (`features.js`) kommt nicht dazu: es sind bestehende Zahlen.

## Entscheide (für decisions.md)
- 08.11.2026: Eine Zahl, eine Regel. Wo dieselbe Menge an zwei Orten steht, rechnen beide mit derselben Funktion; zählen sie Verschiedenes, nennt die Zeile das Wort dafür.

## Stand im Plan (roadmap.md / vorhaben.md)
- UX-Test 08.11.2026, Frage 4: die sechs Zahlen-Widersprüche sind behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Woche in einer Woche mit einer Tour: die Zeile unter dem Titel beginnt mit «1 Tour».
2. Touren öffnen, dann Rückblick: die Zahl bei «Abgeschlossen» ist gleich wie «n warten auf deinen Rückblick».
3. Aktiv: Kopfzeile «diese Woche 1 von 13 Zielen im Soll», Wochenkarte «12 Ziele offen».
4. Material am Computer: unter «gewogen» steht das Essen klein daneben.
