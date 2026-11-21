# Was mir gut tut öffnet wieder

Auftrag: Noah 21.11.2026, Fehlerbild «Fehler auf der Seite «Auswerten › Was mir gut tut»: Illegal invocation» (Thread «Fix Absturz «Was mir gut tut»»).

## Was ist neu
- Fehler: Die Seite «Was mir gut tut» stürzte ab, sobald «Energieräuber anzeigen» eingeschaltet war und es mindestens einen Energieräuber gab. Ursache: Im Abschnitt «Energieräuber» stand ein `<details>` (das Aufklappfeld «Wie kommt die App darauf?») innerhalb eines `<p>`. Der Browser schliesst ein `<p>` dort von selbst, die Seite baut sich anders auf, als die App erwartet, und wirft «Illegal invocation». Der Fehler hing an Noahs Daten und Einstellung (Schalter an), darum zeigte ihn kein Test mit erfundenen Daten.
- Der Abschnitt nutzt jetzt ein `<div>`; nichts sieht anders aus.
- Kein heutiger Merge (1315, 1321, 1322, 1331, 1330, 1257) hat den Fehler ausgelöst: die Stelle ist alt. Er zeigt sich erst mit dem Schalter «Energieräuber anzeigen».
- Zwei neue Tests: ein Browser-Test, der den Schalter einschaltet (mit erfundenen Tagen, an denen viel Bildschirmzeit ein schlechter Tag ist), und ein Prüf-Test, der alle Seiten der App nach einem Blockelement in einem `<p>` absucht. Beide scheitern ohne den Fix.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur diese eine Stelle geändert; die Suche über alle Seiten fand keine zweite.
- `docs/app-stand.md`: ein Satz bei «Was mir gut tut» zum Schalter und zum neuen Prüf-Test.

## Stand im Plan (roadmap.md / vorhaben.md)
- Nichts ändert sich im Plan.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Was mir gut tut öffnen: die Seite lädt, auch mit eingeschaltetem «Energieräuber anzeigen».
2. Bei «Energieräuber» ein «Wie kommt die App darauf?» antippen: es klappt auf.
