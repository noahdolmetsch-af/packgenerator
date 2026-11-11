# Ruhigeres Scrollen und Seitenwechseln

PR folgt · 11.11.2026 · Auftrag: Noah «c» (Thread «Ruckelfunktion finden und entfernen»)

Ziel 5 «Alltag»: die App soll sich flüssig anfühlen. Noah spürte Ruckeln beim Scrollen und beim Seitenwechsel; eine einzelne «Ruckelfunktion» gibt es nicht. Zwei kleine Bewegungs-Effekte aus Paket A «Seitenwechsel» (03.11.2026) kommen auf seinen Wunsch raus.

## Was ist neu
- Nichts Neues. Zwei Effekte sind entfernt: die kleine Titelzeile oben beim Scrollen (Idee 5, `MiniTitle.svelte` prüfte bei jedem Scroll-Bild, ob oben eine Leiste im Weg steht) und das Mitfliegen des Tour-Namens beim Öffnen (Idee 2, `vtitle.js`, View Transition).
- Die grosse Überschrift jeder Seite bleibt wie sie war. Die Tourenliste öffnet eine Tour wie vorher, nur ohne die Bewegung.
- Die alten «Was ist neu»-Zeilen dieser beiden Ideen führen nicht mehr zu einer Stelle («Ausprobieren» aus).

## Was fällt weg oder rutscht tiefer
- Kleine Titelzeile oben beim Scrollen: fällt weg (vorher stand der Seitenname beim Scrollen oben; jetzt scrollt der grosse Titel einfach weg).
- Titel fliegt mit: fällt weg (vorher flog der Tour-Name beim Öffnen in 0,26 s zur Überschrift der Tour-Seite; jetzt öffnet die Seite sofort).
- Noah hat beides am 11.11.2026 mit «c» gewählt.

## Selbst entschieden
- «c» bezog sich auf beide Punkte (2 und 3 der Liste), weil die Antwortzeile sie zusammen nannte; die übrigen Bewegungen (Richtung zeigen, Markierung gleitet, Ruhiges Einblenden) bleiben.
- Tests der entfernten Teile (`tests/vtitle.test.js`, `tests/e2e/titelflug.spec.js`, `tests/e2e/titel-klein.spec.js`) sind gelöscht, weil es die Teile nicht mehr gibt, nicht um etwas grün zu machen.
- Die alten «Was ist neu»-Dateien `titel-wird-klein.js` und `titel-fliegt-mit.js` bleiben als Verlauf, ihre «Ausprobieren»-Knöpfe sind auf `go: null` gesetzt.
- `docs/app-stand.md` nennt diese Effekte nicht, darum keine Änderung dort.
- Der eigentliche Hauptgrund für das Ruckeln (Kopieren der Fahrten bei jeder Datenabfrage, Abgleich alle 20 s) ist PR #1251 und nicht Teil davon. Es bleibt offen, ob es danach noch ruckelt.

## Entscheide (für decisions.md)
- 11.11.2026: Kleine Titelzeile beim Scrollen und Mitfliegen des Tour-Namens entfernt (Noah «c», Grund: Ruckeln beim Scrollen und Seitenwechsel).

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket A Seitenwechsel, Ideen 2 und 5: zurückgebaut. Die Ideen 1, 3 und 4 bleiben gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen und nach unten scrollen: oben erscheint keine kleine Titelzeile.
2. Eine Tour aus der Liste öffnen: die Seite öffnet sofort, ohne dass der Name fliegt.
3. Zurück zur Liste: die Seitenwechsel gleiten weiter wie vorher (tiefer von rechts, zurück von links).
