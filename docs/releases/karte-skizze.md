# Karte der App als Skizze

Auftrag: Noah «1a 2b 3a 4a 5a» (Thread «Versteckte Inhalte auffindbar machen»), Schritte 1 und 4 in einem PR, weil beide nur die Karte betreffen (Noah 23.11.2026 «PRs bündeln»); dazu V5 «Ein Ort pro Seite» aus dem Auftrag «Klarheit und Auffindbarkeit» (Noah «1-5a»), damit nur eine Liste der Orte entsteht.

## Was ist neu
- Die Karte der App (Ich › Karte der App) zeigt die **Orte der Leiste** (Heute, Woche, Touren, Velos und Material, Auswerten, Wetter, dazu «Ich» für Daten, Einstellungen und Hilfe). Sie werden aus `nav.js` gelesen und folgen jedem Umbau von selbst. Vorher: fünf alte Bereiche, «Ich» mit 257 von 503 Funktionen.
- Jeder Ort zeigt seine **Seiten als Punkte**: gefüllt = auf diesem Gerät geöffnet oder laut deinen Daten genutzt, Ring = noch nie geöffnet, Stern = neu in den letzten zwei Wochen. Ein Tipp geht hin.
- Oben «n von m ausprobiert» und die Filter «Alle», «Noch nie geöffnet», «Neu».
- «Alle n Funktionen» pro Ort öffnet die Liste mit dem Pfad jeder Funktion (wie die alte Karte); die Suche findet weiter jede Funktion.
- «Alle Bereiche» am Ende von Heute führt zur Karte; der Katalog («Funktionen nach Situation, mit Suche») ist einen Tipp weiter.
- **Ein Ort pro Seite (V5):** die Suche nennt den Ort einer Seite aus derselben Quelle wie die Leiste und die Karte (`nav.js`), mit dem Reiter: «Meilensteine» steht jetzt unter «Auswerten › Fahrten», nicht mehr unter «Woche» (`wegOf` in `src/lib/nav/seiten.js`). Wächter-Test `tests/ort-pro-seite.test.js`: jede Adresse des Katalogs und der Suche hat genau einen Ort der Leiste oder «Ich».
- «Geöffnet» wird **pro Gerät** gezählt (Noah 5a), im schon bestehenden Feld `quickLinks.used.<Gerät>` (neu `opened`: Seite → erster Tag).

## Was fällt weg oder rutscht tiefer
- Die fünf alten Bereiche der Karte (Touren, Material, Velos, Heute abhaken, Ich) sind durch die Orte der Leiste ersetzt; jede Funktion steht weiter in der Karte, jede alte Adresse geht weiter.
- «Alle Bereiche» am Ende von Heute führt zur Karte statt zum Katalog; der Katalog ist dort einen Tipp weiter.
- In der Suche steht unter den Treffern für Seiten nicht mehr die alte Gruppe («Material», «Woche» für Meilensteine, «Ich» für Eingang und Notizen), sondern der Ort der Leiste mit Reiter.
- Die Ziehharmonika pro Ort ist jetzt «Alle n Funktionen» unter den Punkten (ein Tipp tiefer).

## Selbst entschieden
- Die handgeschriebenen Gruppen in `src/lib/nav/menu.js` bleiben (Wörter, Reihenfolge, Zeilen ohne Adresse); nur die Zeile unter dem Treffer kommt aus `nav.js`. Sieben Seiten ändern dort ihre Angabe (Fahrten, Material-Seiten → Velos und Material, Auswerten, Meilensteine, Eingang und Notizen → Woche, Inspiration → Touren).
- Ein **Punkt** ist eine Adresse ohne Filter (Seite oder Reiter) mit den Funktionen, die dort wohnen; eine Funktion ohne Adresse (ein Fenster) ist ein eigener Punkt. Der Name des Punkts ist die Funktion, die auf der Seite selbst sitzt.
- Funktionen, die `nav.js` keinem Ort zuordnet, gehen nach dem alten Bereich (Material und Velos → Velos und Material, Aktiv → Woche) oder nach «Ich».
- «Geöffnet» zählt ab heute: das Gerät kennt nur Seiten, die es seither geöffnet hat; dazu zählt, was deine Daten als genutzt zeigen (wie «n von m ausprobiert» im Katalog). Darum sind am Anfang viele Ringe.
- «Neu» = Funktion einer Version der letzten 14 Tage (`since` der News-Dateien), solange der Punkt nicht geöffnet ist.
- Keine Datenänderung: kein Dexie-Schema, kein neues Backup-Format, kein `api/`. Nur ein Feld `opened` im bestehenden Gerät-Eintrag der Quick Links.
- Schritt 5 «geöffnet pro Gerät, nicht im Backup»: der Eintrag liegt wie die Pins im Gerät-Schlüssel (`phone` / `computer`), so wie die Quick-Links-Pins.

## Entscheide (eigene Datei)
- `docs/decisions/karte-skizze.md`

## Stand im Plan
- Auffindbarkeit (Weg 3): Schritte 2, 3 (Heute entdecken), 1, 4 (Karte) gebaut; Wegweiser + Wächter (5) folgt, «Nach Moment» (6) nur auf Noahs ausdrücklichen Wunsch.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute ganz nach unten, «Alle Bereiche» antippen: die Karte zeigt die Orte der Leiste mit Punkten.
2. «Noch nie geöffnet» antippen: es bleiben die Seiten, die du nicht kennst; einen Punkt antippen, zurück: er ist gefüllt.
3. «Alle n Funktionen» bei einem Ort öffnen: die Liste mit Pfad; im Suchfeld ein Wort tippen.
