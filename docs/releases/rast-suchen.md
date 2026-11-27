# Rast suchen (Pausen-Planer)

Auftrag: Noah 26.11.2026 «1a 2a 3a 4a» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»); Karte «Was ist der beste Pausen-Vorschlag, und was gilt ohne Netz?» → «Kürzester Umweg zuerst».

## Was ist neu
- Auf der Live-Karte (auf einer Strecke) gibt es die Karte «Rast» mit dem Knopf «Rast suchen». Ein Tipp nennt bis zu drei Orte zum Anhalten (Laden, Essen, Tankstelle, Wasser) in den nächsten 20 km der Strecke, der kürzeste Umweg zuerst, offene vor geschlossenen.
- Jeder Ort zeigt Name, Entfernung und den Umweg in km («direkt an der Strecke» ohne Umweg).
- Ist in den 20 km nichts, sagt die Karte das und nennt den nächsten Ort dahinter.
- Ohne Netz zählen nur Orte, die vorher geladen wurden («Stopps entlang der Strecke»); ist nichts geladen, sagt die Karte, dass man sie laden soll.

## Was fällt weg oder rutscht tiefer
nichts.

## Selbst entschieden
- Gesucht wird erst auf Tipp, nichts läuft im Hintergrund (Akku, Daten).
- Umweg = zweimal der Abstand zur Strecke; Reihenfolge: offen vor geschlossen, dann Umweg, dann Entfernung.
- Keine neue Funktion in `features.js` und kein neuer Absprung: es ist eine Karte auf der bestehenden Live-Karte, innerhalb der bestehenden Zeilen (Fertig-Regel Punkte 1–3 werden durch die Live-Karte erfüllt).
- Das Funkloch-Notausstieg-Stück ist weggelassen, wie Noah es entschieden hat.

## Entscheide
- 26.11.2026: `docs/decisions/rast-suchen.md`

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte auf einer Strecke starten, zur Karte «Rast» scrollen.
2. «Rast suchen» tippen: bis zu drei Orte mit Umweg, oder der Grund, warum keine da sind.
