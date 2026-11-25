# «Bereit zur Abfahrt?» passt wieder auf schmale Handys

PR #1783 · 23.11.2026 · Auftrag: Bündler (zwei rote Handy-Tests auf main); Ziele: Klarheit und Auffindbarkeit

## Was ist neu
- Auf einem 320-px-Handy machte die Karte «Bereit zur Abfahrt?» (Packen, vor der Tour) die ganze Seite 1 px zu breit. Seit «Griffbereit» hat die Karte eine Zeile mehr, und ihre Titelzeile (Titel, Zeichen, «Fast bereit», Pfeil) passte nicht mehr in eine Zeile.
- Jetzt bricht die Titelzeile um, wenn es eng wird, und die Karte darf nie breiter sein als die Seite. Die Zeilen darunter sind so breit wie die Karte. Auf Computer und grossen Handys sieht man keinen Unterschied.
- Ursache der roten Tests: `schedule.spec.js:94` («Today: two days before …») und `sets.spec.js:190` («New trip window …») messen auf dem Handy bei 320 px, ob die Seite seitwärts scrollt. Beide fanden die Karte unter der Heute-Kachel. Echter App-Fehler, der Test blieb unverändert.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur die Titelzeile der Karte angepasst (`src/lib/trip/TourAmpel.svelte`: Umbruch, Spalte `minmax(0, 1fr)`), keine Zeile gekürzt und nichts versteckt.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Handy schmal (320 px oder Browser-Fenster schmal ziehen): Packen, geplante Tour, Karte «Bereit zur Abfahrt?» ist zu, die Seite lässt sich nicht seitwärts schieben.
2. Karte aufklappen: die Zeilen sind so breit wie die Seite, nichts ist abgeschnitten.
3. In GitHub: `schedule.spec.js` und `sets.spec.js` (Handy) sind grün.
