# Traum der Woche

PR (diese Änderung) · 07.11.2026 · Auftrag: Noah «1a, 2, 3a, 4 weglassen» (Thread «Neu lancieren Neuland», letzter Punkt von «Träume und Neuland»)

## Was ist neu
- Heute: Kachel «Traum der Woche» (`src/lib/home/WochenTraumTile.svelte`, Auswahl in `src/lib/dreams/wochentraum.js`). Sie erscheint nur, solange ein Traum passt, sonst bleibt sie weg.
  - Traum mit festem Datum: Countdown ab 90 Tagen vorher; liegen seine Tage in der 16-Tage-Vorhersage, steht das Wetter für genau diese Tage da («Die Tage sehen gut aus» oder «Nicht ideal: Regen, eine kalte Nacht»). Vorher steht, in wie vielen Tagen die Vorhersage die Tage erreicht.
  - Traum ohne Datum: passt, wenn der Monat stimmt und die nötigen Tage trocken sind (2–3 am Stück).
  - «Fährt durch die Nacht»: jede Tag muss trocken sein, die Nacht über 5 °C und der Wind höchstens 30 km/h.
- Touren › Träume › Traum öffnen: neue Felder «Festes Datum» und «Fährt durch die Nacht» (beide freiwillig). Eigene Träume legt man wie bisher selbst an.
- Der Wetterspeicher der Träume behält jetzt auch Nachttemperatur und Wind.
- Neue Funktion `f.dreamweek`; Heute-Wand v 20 (die Kachel kommt einmal unter «Entdecken», danach bleibt sie weg, wenn man sie entfernt).

## Was fällt weg oder rutscht tiefer
- Heute: unter «Entdecken» kommt eine Kachel dazu (nur wenn ein Traum passt); alles darunter rutscht entsprechend nach unten. Sonst nichts.

## Selbst entschieden
- Ein Traum mit Datum zeigt sich ab 90 Tagen vorher; ein Traum mit Datum innerhalb der Vorhersage geht vor einem Traum ohne Datum.
- Fehlt dem Speicher Nachttemperatur oder Wind (alter Stand), zählt das nicht gegen den Traum; nach der nächsten Aktualisierung (3 Stunden) ist alles da.
- Teilen entfällt (Noah «4 weglassen»). Name und Datum eines Traums stehen nur in den Daten, nie im Code.
- Eine zweite Kachel-Version (v 20, nach «Spruch» mit v 19) war nötig, weil die Kachel sonst auf einer gespeicherten Heute-Wand nie erscheinen würde.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: letzter Punkt «Traum der Woche» gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume: einen Traum öffnen, ein «Festes Datum» in den nächsten Tagen eintragen, «Fährt durch die Nacht» setzen.
2. Heute: «Traum der Woche» zeigt Countdown und das Wetter für diese Tage.
3. Das Datum löschen und einen Traum ohne Datum im passenden Monat haben: die Kachel zeigt die trockenen Tage, oder bleibt weg, wenn keine da sind.
