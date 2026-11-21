# Sportjahr: alle Sportarten in Stunden

21.11.2026 · Auftrag: Noah «1 a dann b, 2b, 3a, 4a, 5a» und «ich möchte alle entwürfe 1-3 umsetzen» (Thread «Jede Sportart durchgehen», Umsetzungsauftrag S3, Entwurf 1)

## Was ist neu
- Neue Seite **Sportjahr** (`#/auswerten/sportjahr`), erreichbar über eine ruhige Link-Zeile auf der Auswerten-Startseite (kein neuer Reiter, damit die Reiter nicht mehr werden). Oben der Zeitraum-Schalter von Auswerten (Woche, Monat, Jahr, Alles, eigener Zeitraum).
- Vier Zahlen: Zeit in Bewegung, Einheiten, Tage mit Training, Sportarten. Wo die Zeit geschätzt ist, steht eine Zeile «Bei N Einheiten ist die Zeit geschätzt (etwa X h, «ca.»)» mit Link zur Übliche-Dauer-Einstellung (S1).
- Diagramm «Stunden pro Monat» (Jahr), «pro Tag» (Woche, Monat) oder «pro Jahr» (Alles), gestapelt nach Sportart, im Jahr mit dem Vorjahr als gestrichelte Linie; Zahlen beim Zeigen, «Als Tabelle».
- «Wo ging die Zeit hin?» mit Umschalter Stunden, Einheiten, Tage, km; je Sportart ein Balken, die Anzahl und der Vergleich mit dem Vorjahr bis zum gleichen Tag (am Computer).
- «Rekorde und Serien» (längste Woche, meiste Einheiten an einem Tag, längste Serie) und im Jahr «Wochen mit Training» (mindestens 2 Einheiten).
- Leerer Zeitraum: «In diesem Zeitraum ist nichts» mit Weg zu Aktiv.

## Was fällt weg oder rutscht tiefer
- nichts (die alten Auswertungen «Haken ausgewertet» und die Rangliste bleiben, bis S5 sie ablöst, wenn Noah S3 freigegeben hat)

## Selbst entschieden
- **Abweichung vom Entwurf:** der Tipp auf eine Sportart öffnet noch keinen Rückblick (das ist S4); die Zeile «Dauer nachtragen» (S12) und das Stundenziel als Linie (S10) kommen als eigene PRs. Die Wochen-Karte erscheint nur in der Jahresansicht.
- Es zählt nur Bewegung (Ring «Bewegen»). Meditation und Sauna stehen nicht drin; der Arbeitsweg von Hand (ohne Zeit) und gezählte Mengen (Liegestütze) zählen nicht in Stunden.
- Farben: die sieben grössten Sportarten des Zeitraums haben eine eigene Farbe, der Rest ist «Andere». Die Namen stehen immer dabei.
- Strava-Sportarten ohne Aktivität (Wandern, Langlauf, Schwimmen …) stehen als eigene Zeilen mit ihrem Strava-Namen, bis S7 dafür eine Aktivität anlegt.
- Das Vorjahr gilt für Woche, Monat, Jahr und eigenen Zeitraum bis zum gleichen Tag; bei «Alles» gibt es keinen Vergleich.
- Fertig-Regel: (1) `f.sportjahr` in `features.js` mit So geht's und Beispiel, (2) Absprung: die Link-Zeile auf der Auswerten-Startseite und der Link «Übliche Dauer ändern», (3) «Gut zu wissen»: nicht gebaut, die Seite steht nicht in `ON_PAGES`, (4) leerer Zustand siehe oben, (5) nächster Schritt: «Übliche Dauer ändern» und «Zu Aktiv», der Rückblick pro Sportart folgt mit S4, (6) Zeile im App-Stand.
- Namen: «Sportjahr» in `docs/namen.md` Nr. 27 (Arbeitsname).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Sportjahr: S3 gebaut (hängt an S1 und S2). Danach S4 Rückblick pro Sportart, S5 alte Auswertung ablösen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Link «Sportjahr» › «Jahr»: oben stehen Stunden, Einheiten, Tage und Sportarten; das Diagramm hat zwölf Monate und eine gestrichelte Linie fürs Vorjahr.
2. Unter «Wo ging die Zeit hin?» auf «km» tippen: nur Sportarten mit Strecke bleiben.
3. «Alles» tippen: ein Balken pro Jahr.
