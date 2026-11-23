# Tests nachgezogen und drei Fehler behoben (Nachtprüfung 22.11.)

22.11.2026 · Auftrag: Noah «ja» zu «ein PR nur mit Tests für die veralteten Tests, dazu drei kleine Fixes», und «in EINEM PR bündeln» (Thread «Prüfungen so einrichten, dass main grün bleibt»); Quelle: die rote Volle Prüfung vom 22.11. 20:09

## Was ist neu
**App (sichtbar, klein): lange Wörter trennen sauber.** In schmalen Karten brach ein langes Wort mitten im Buchstaben um. Jetzt trennt die Schrift an einer Silbe mit Trennstrich (`hyphens: auto`, wie schon bei Kacheln und Teilen) oder behält das Wort ganz:
- Fenster «Neu» am Computer: «Überraschungsrunde» (vorher «Überraschungsrund / e»).
- Kleiderschrank: Schichtnamen wie «Accessories» in den Kacheln und Überschriften.
- Velopflege, Zeile «Velomech & 2026» auf einem kleinen Handy (320 px): die Wörter bleiben ganz, die Zahlen rechts («4 Arbeiten · ich 5 · Velomech 3») rutschen in die nächste Zeile.

**Tests nachgezogen (keine App-Änderung):**
- `seitenleiste-weitere-orte.spec.js`: seit «sieben Orte und Ich» passt die Liste bei 780 px Höhe ganz hin, der Knopf «Weitere Orte» ist dann nicht da. Der Test nutzt jetzt ein niedriges Fenster (520 px, die Seitenleiste bleibt über 500 px).
- `umweg-zurueck.spec.js` (Wackler, 2 von 12 rot unter Last): Der Router gibt dieselbe Frage 10 Minuten lang aus dem Speicher zurück (`ROUTER_CACHE_MS`). Ob der zweite Plan eine neue Anfrage braucht, hängt vom letzten Standort ab. Der Test zählt nicht mehr starr «2 Anfragen», sondern prüft, dass die neue Karte kommt, und dass «Rückgängig» nichts mehr anfragt. «Navigation beenden» wird mit `tapGone` wiederholt, wenn ein Tipp verloren geht. Nachgestellt: vorher 2 von 12 und 1 von 18 rot, nachher 24 von 24 grün.
- `gesamttest/scenarios.spec.js` S9 «Fahrten importieren»: seit dem Umbau der Velopflege («Mehr zugeklappt») liegen das Fahrtenbuch mit «Fahrten importieren» und «Rückgängig» hinter «Mehr». Der Test öffnet «Mehr», wie ein Mensch es täte.
- `gesamttest/consistency.spec.js` «due counts»: die Zeile `details[open]` erfasste auch das offene Fenster «Am Vorabend laden» (3 Punkte). Jetzt nur noch «Vor der Tour». Dazu wartet der Test, bis die Plan-Zeile die Zahl der Velopflege nennt (der erste Blick zeigte ab und zu einen Punkt weniger). Nachgestellt: vorher 1 von 3 rot (Handy), nachher 8 von 8 grün.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die drei «abgeschnittenen Wörter» sind echte Anzeigefehler und in der App behoben, nicht im Test gelockert. Dafür die bereits übliche Lösung `hyphens: auto` (die Prüfung zählt eine bewusste Silbentrennung nicht als Fehler).
- In der Velopflege-Zeile bekommt der rechte Teil die Möglichkeit umzubrechen, der Name nicht: `min-width: min-content` auf dem Namen, `flex-wrap` rechts. Auf breiten Bildschirmen ändert sich nichts.
- S9 und «due counts» sind Test-Anpassungen an gewollte Umbauten (#1362, Plan-Zeile); keine App-Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Computer «Neu» öffnen: «Überraschungsrunde» steht ganz oder mit Trennstrich bei einer Silbe.
2. Handy: Velos › Pflege › unten «Velomech & 2026»: die Wörter sind ganz, die Zahlen stehen rechts oder in der nächsten Zeile.
3. Nachtprüfung: «wardrobe», «care-hardtail», «today-new-sheet», «due counts», «S9», «Seitenleiste» und «Umweg» sind nicht mehr rot.
