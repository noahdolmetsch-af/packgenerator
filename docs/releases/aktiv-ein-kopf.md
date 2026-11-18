# Ein Kopf für alle Aktiv-Seiten

PR folgt · 17.11.2026 · Auftrag: Noah «a» (Thread «UI-Test der Seite Flow», Funde 1 und 5)

## Was ist neu
- Woche, Erholung, Sporttasche und Ideen beginnen wie Training, Meine Aktivitäten und Meditation: Pfad, Titel, Einstieg.
- Ein Tipp auf einen Tag in der Karte «Diese Woche» (Aktiv) öffnet die Woche an diesem Tag; der Tag ist markiert und im Bild.
- «Alles hier» auf Aktiv hat zwölf statt zehn Kacheln: neu «Sporttasche» und «Ideen».

## Was fällt weg oder rutscht tiefer
- Die Reihe mit fünf Karten über dem Titel (Woche, Erholung, Sporttasche, Meine Aktivitäten, Ideen) auf diesen vier Seiten fällt weg (`MoreAktiv.svelte` und `morepages.js` sind gelöscht).
- Alter Weg zu Sporttasche und Ideen: Karte auf Woche oder Erholung. Neuer Weg: Kachel in «Alles hier» auf Aktiv (Sporttasche auch aus Heute und aus jeder Sportart).
- Alter Weg zwischen Woche und Erholung: Karte. Neuer Weg: Reiter «Erholung» in der Seitenleiste (Handy: Reiterzeile), Woche über die Karte «Diese Woche».

## Selbst entschieden
- «Woche» bekommt keine eigene Kachel in «Alles hier»: sie stünde neben «Woche planen» und würde verwirren; der Weg ist die Karte «Diese Woche».
- Der angetippte Tag wird markiert und in die Mitte gerollt, die Woche bleibt ganz sichtbar (kein Aufklappen).
- Ein Tipp auf die Karte ausserhalb der Tage (Kopfzeile «Woche planen») öffnet weiter die ganze Woche.

## Stand im Plan (roadmap.md / vorhaben.md)
- nichts geändert (UI-Test Flow, Vorschlag a)

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv: in «Diese Woche» einen Tag antippen: die Woche öffnet sich, der Tag ist markiert.
2. Aktiv › Alles hier: «Sporttasche» antippen: die Seite beginnt mit dem Titel, keine Kartenreihe darüber.
3. Aktiv › Erholung (Reiter): Titel zuerst, wie bei Training.
4. Handy: «Woche» öffnen, der Titel steht weit oben.
