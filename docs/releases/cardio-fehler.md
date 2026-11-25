# Cardio-Belastung: besser lesbar

PR #<Nummer> · 07.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5b» (Thread «UI-Test Analyse-Seite: Design und Verständlichkeit»)

## Was ist neu
- **Wochentag-Balken:** sie zeigen jetzt echte Unterschiede, mit der Zahl über jedem Balken. Vorher waren alle gleich hoch (das Layout drückte sie auf 105 px).
- **Tour-Namen im Verlauf:** ein Name steht nur, wo Platz ist, nie über einem anderen und nie über den Rand. Die Legende zählt die Touren («14 Touren, Namen nur, wo Platz ist»). Am Handy wird die Seite nicht mehr breiter als der Bildschirm.
- **Karte «Pro Wochentag»:** so hoch wie ihr Inhalt, nicht mehr auf die Höhe der Karte «Tage» gestreckt.
- **«Am Tag davor gemacht»:** neue Überschrift, und «nichts abgehakt» statt «–».
- **«+ Wert»:** ein kleiner Knopf in der Zeile der Vorschläge, nicht mehr eine ganze Zeile.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Balken beginnen knapp unter dem tiefsten Wert, auch bei Summen-Werten (es sind Mittelwerte pro Wochentag). Ein Satz unter den Balken sagt das; die Zahlen darüber sind genau.
- Fitbit-Training bei «Am Tag davor» und die Tour-Liste kommen im Thread «Cardio-Belastung: Ideen A–F» (Noah «5b»).
- Fachwörter («Was ist das?») baut der Vereinfachen-Thread, nicht dieser PR.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Analyse › Alle Werte › Herz › Cardio-Belastung, Zeitraum «3 M»: die Balken bei «Pro Wochentag» sind verschieden hoch, über jedem steht eine Zahl.
2. Im Verlauf liegen keine Tour-Namen übereinander; unter dem Verlauf steht «N Touren, Namen nur, wo Platz ist».
3. Am Handy lässt sich die Seite nicht seitlich schieben.
