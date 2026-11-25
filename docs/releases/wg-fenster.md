# «Wi gaht's? am Abend»: ruhiger und nie abgeschnitten

PR · 24.11.2026 · Auftrag: Noah (Screenshot «ganz leicht abgeschnitten», «a und b»)

## Was ist neu
- Das Fenster von «Wi gaht's?» öffnet sich nicht mehr von selbst über Heute. «Jetzt dran» (oder die Körper-Kachel) sagt, was wartet; «Los» öffnet das Fenster.
- Eine Frage pro Bildschirm mit «Weiter» und «Zurück»; bei der letzten Frage «Speichern». Oben «Frage 2 von 3».
- Kopf und Fusszeile bleiben im Bild, nur die Mitte scrollt; ein Schatten am Rand zeigt, dass es weitergeht. Das Fenster wird nie höher als der Bildschirm.
- Das × (und Escape) schliesst nur das Fenster; «Heute nicht» legt die Fragen bis morgen weg. «Später» entfällt.
- Am Abend fragt das Fenster nichts mehr vom Morgen (Traum, kurze Nacht, Ruhepuls).
- «Stimmt das heute?» heisst «Merkst du das heute auch?»; der Grund sagt, was deine Daten zeigen, und die Frage kommt nur bei klarem Unterschied (mindestens 10 Prozent).
- Das × hat beim Öffnen keinen dicken Rahmen mehr.
- Die Antworten (Stufen wie «Gut», Chips wie «Schön») beginnen immer mit einem Grossbuchstaben, wie bei den Datenfragen.
- «Warum frage ich das?»: die letzte Zeile mit «Regel ändern» ist nicht mehr höher als die anderen.

## Was fällt weg oder rutscht tiefer
- «Später» im Fenster und der Hinweistext darunter («Später» bringt das Fenster in einer Stunde zurück …).
- Alle Fragen auf einmal untereinander: sie stehen nacheinander, die Links («Ganzer Abend-Rückblick», «Anpassen», «Verlauf») und die Velo-Zeile stehen bei der letzten Frage.

## Selbst entschieden
- Die kleingeschriebene Frage «warum hast du letzte nacht weniger als 5h geschlafen? …» ist Noahs eigene Regel mit seinem Text; sie wird nicht umgeschrieben.
- Morgenfragen am Abend: «Morgen» heisst Zeit der Frage vor 11:00 (die Tagesuhr der App).
- Mindestunterschied 10 Prozent bei der Vermutungsfrage.
- Ohne «Jetzt dran»-Zeile (nur Kachel «Heute-Check» an) bekommt die Zeile «Wi gaht's?» einen «Los»-Knopf, damit das Fenster erreichbar bleibt.
- Der allgemeine Wächter-Test für abgeschnittene Fenster kommt vom Thread «App schöner»; hier prüft ein Test das Fenster bei 1440×800 und auf dem Handy.

## Entscheide (eigene Datei `docs/decisions/wg-fenster.md`)
- 24.11.2026: Regel «Nie abgeschnitten», eine Frage pro Bildschirm, kein Selbst-Öffnen, Abend ohne Morgenfragen (Noah «a und b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Nichts geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: das Fenster öffnet sich nicht von selbst; «Jetzt dran» nennt «Wi gaht's? am Abend · N Fragen».
2. «Los» tippen: eine Frage, «Weiter», «Zurück», bei der letzten «Speichern»; Kopf und Fusszeile bleiben beim Scrollen.
3. Auf dem Laptop (1440×800) und am Handy: Weiter/Speichern ist immer ganz sichtbar.
4. × tippen: Fenster zu, «Los» noch da.
