# Woche: «n von m Einheiten erledigt» und die Ziele der Woche auf einer Seite

Schritt V1 des Auftrags «App vereinfachen» (`/mnt/project-files/notes/vereinfachen-durchgang-2026-11-21/umsetzungsauftrag-vereinfachen.md`) · 21.11.2026 · Entscheid Noah «1a 2a 3a 4a 5a» (21.11.2026 17:50 UTC), Entwurf «Woche» auf der Bilder-Seite https://claude.ai/artifact/MLJqa4PpNZAoHFLB51vWie

## Was ist neu
- Die Seite «Woche» (`#/week`) zählt oben «2 von 5 Einheiten erledigt» (statt nur «5 Einheiten»), zusammen mit Terminen, Aufgaben und Touren.
- Rechts neben den Tagen (am Handy unter den Tagen) stehen die **Ziele der Woche** (zum Beispiel 2× Meditation, 150 km Velo), mit Balken, ändern, ordnen und löschen mit Rückgängig. Das ist dieselbe Karte wie auf Aktiv; die Zahlen sind dieselben.
- Für die nächste Woche steht die Karte nicht (die Ziele zählen die laufende Woche).

## Was fällt weg oder rutscht tiefer
- nichts. Die Karte «Meine Wochenziele» steht vorerst auch noch auf Aktiv; sie wandert mit dem Bereich «Woche» (Schritt V4), wenn Aktiv und Planen zusammenkommen.

## Selbst entschieden
- Erst das Lesen auf einer Seite (dieser PR), danach führen Aktiv › Woche, Training › Woche, Wochenplan und Mein Trainingsplan auf die eine Woche (V3). So bricht keine bestehende Funktion weg, bevor ihr Ersatz da ist.
- Keine Datenänderung: Die Seite liest die gleichen Quellen wie vorher (`flowLog`, Trainingsplan, feste Termine).
- Der Entwurf zeigt die Tage als Spalten; die Seite hat schon Tage (am Computer als Spalten, am Handy zum Aufklappen). Das lasse ich, weil es schon so gebaut und getestet ist.

## Entscheide (für decisions.md)
- keine neuen (Entscheid vom 21.11.2026 steht im Eintrag «Fünf Bereiche»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App»: Schritt V1 gebaut; als Nächstes V3, V4 (Bereich «Woche» und Menü mit 5 Bereichen), V7. Gestern nachtragen, «Heute dran» und der gemeinsame Haken liegen beim Training-Thread.

## Prüfschritte (nach dem Merge, auf der echten Seite)
1. Öffne «Planen» › «Woche»: oben steht «n von m Einheiten erledigt».
2. Scrolle zu «Meine Wochenziele» (am Computer rechts): dieselben Ziele und Balken wie auf Aktiv.
3. Tippe «Nächste Woche»: die Karte der Ziele ist dort nicht da.
