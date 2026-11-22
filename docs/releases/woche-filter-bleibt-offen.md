# Der Filter der Woche bleibt offen

22.11.2026 · Auftrag: Noah «ja» zu «jeden Tag einen Wackel-Test an der Ursache reparieren» (Thread «Prüfungen so einrichten, dass main grün bleibt»); entdeckt in PR 1416, Teil 5 (woche-planen.spec.js rot, auch auf reinem main 2 von 8 Läufen)

## Was ist neu
- Auf Planen › Woche schliesst sich der aufgeklappte «Filter» nicht mehr von selbst, wenn die Wochendaten etwa eine Sekunde später nachladen. Dasselbe gilt für «Woher kommen die Vorschläge?», «Saisonideen ändern» und «Weggelegt».
- Ursache: das Feld «offen» hing nur an den ausgeblendeten Arten. Beim Nachladen der Wochendaten setzte die Seite es wieder auf «zu», auch wenn du es gerade geöffnet hattest. Bei den Quellen und den anderen Falten kam ein zweiter Zufall dazu: der Zustand wurde erst über das spätere «toggle»-Ereignis gemerkt, nach einem Nachladen im falschen Moment ging er verloren. Jetzt schaltet der Tipp auf die Überschrift den Zustand sofort (`fltOpen`, `srcOpen`, `ideasOpen`, `neverOpen`).
- Der Test `woche-planen.spec.js` blieb unverändert. Nachgestellt (4 Läufe gleichzeitig): vorher 4 von 8 rot (Handy), nachher 8 von 8 grün; danach auf dem Desktop noch ein roter Lauf von 10 an der Quellen-Falte, darum die zweite Änderung (siehe oben).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Reparatur sitzt in der App und nicht im Test: ein Nutzer, der den Filter öffnet und ihn kurz darauf wieder zuschnappen sieht, hat denselben Fehler wie der Test.
- Kein neues Menü, kein neuer Text; nur eine Neuigkeit für die Zeile «Was ist neu».
- Nach dem Neuladen der Seite ist der Filter wie bisher zu (die Auswahl der ausgeblendeten Arten bleibt gespeichert).

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung (Ziel 1 «Eine App, die mich im Alltag unterstützt»: weniger Überraschungen)

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Woche: «Filter» antippen. Die Arten erscheinen.
2. Zwei Sekunden warten: der Filter ist noch offen. Nochmals antippen: er schliesst.
3. Nachtprüfung: «Woche: the days with their kinds…» steht nicht in der Wackel-Liste.
