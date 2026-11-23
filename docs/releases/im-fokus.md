# «Im Fokus» für alle Sportarten

Auftrag: Noah «1a 2a 3a 4a 5a» (22.11.2026, Thread «Alle Sportarten und Erholung»), Schritt D. Spezifikation: `notes/alle-sportarten-erholung-2026-11-22/umsetzungsauftrag.md`.

## Was ist neu
- Auswerten › «Im Fokus»: nach den Strava-Sportarten (Velo, Laufen, Wandern, Anderes) kommt eine Karte für jede Sportart, die du in Aktiv abgehakt hast (Tennis, Eishockey, Gym, Yoga …), die mit der meisten Zeit zuerst. Die Karte zeigt die Einheiten der letzten 7 Tage, die Zeit, einen Balken pro Tag und die letzten 4 Wochen als Punkte. Ein Tipp öffnet den «Rückblick pro Sportart».
- Auswerten › «Letzte 7 Tage» (und die Liste des gewählten Zeitraums): eine Zeile pro abgehakter Sportart mit «{n}× Sportart» und der Zeit.
- Eine Zeit, die niemand gemessen hat, steht mit «etwa» (die übliche Dauer der Sportart). Eine Sportart ohne Zeit zählt die Einheiten.
- Ohne Strava-Aktivität in den letzten 7 Tagen, aber mit abgehakten Sportarten, zeigt «Im Fokus» diese statt «Keine Aktivität».
- Die Zahl in der Zeile «Überblick und letzte 7 Tage» (am Handy) zählt die abgehakten Einheiten mit.
- Unter der Haube: `src/lib/flow/tickfokus.js` (nur Lesen, nichts wird gespeichert).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Gezählt werden nur Haken ohne eigene Strava-Aktivität: ein Haken mit Strava-Aktivität zählt schon als Strava-Sportart (Laufen, Wandern, Anderes), das Velo behält seine km aus der Fahrtenliste. So zählt nichts doppelt. Tägliche Gewohnheiten, Fahrten zur Arbeit und Reisetage bleiben draussen, genau wie in der Wochenrechnung.
- Reihenfolge: zuerst die Strava-Sportarten in ihrer bisherigen Reihenfolge (sie tragen km), dann die abgehakten nach Zeit. Alles nach Zeit zu sortieren hätte das Velo ohne Zeitangabe ans Ende gestellt.
- Kein neuer Text für die Hilfe: «Im Fokus» steht schon in der Zeile «Was du hier tun kannst» der Seite; die Fertig-Regel ist damit erfüllt (Seite, Absprung, Inhalt über die bestehende Zeile).
- Kein Datenformat, kein Backup-Thema: nur Lesen.

## Entscheide (für decisions)
- Eigene Datei `docs/decisions/im-fokus.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Alle Sportarten und Erholung»: Schritt D fertig; E (Heute, Sportjahr und die anderen Seiten an dieselbe Liste hängen) folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten: neben den Strava-Sportarten steht in «Im Fokus» eine Karte für jede Sportart, die du abgehakt hast (zum Beispiel Tennis).
2. Die Karte zeigt Einheiten, Zeit (mit «etwa», wenn es die übliche Dauer ist), sieben Balken und vier Wochen als Punkte.
3. «Letzte 7 Tage» (am Handy hinter «Überblick und letzte 7 Tage») nennt sie mit Anzahl und Zeit; ein Tipp öffnet den Rückblick.
