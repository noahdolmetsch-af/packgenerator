# Reifenprofil wird glatter

PR folgt · 03.11.2026 · Auftrag: Noah «b» (alle 5 Ideen von «Paket C: Das Velo lebt»; Thread «Durchgehen: offene Fragen einzeln»), Idee 16

## Was ist neu
- Velos › Pflege › Verschleiss: In der Zeile «Reifen + Dichtmilch» zeigt eine kleine Zeichnung das Profil des Reifens (28 Blöcke auf der Strasse). Je mehr km, desto flacher werden die Blöcke; kurz vor der Grenze ist das Profil fast glatt.
- Dieselbe Zeichnung in der kurzen Verschleiss-Ansicht auf der Pflegeseite eines Velos, wenn die Reifen zu den drei am meisten abgenutzten Teilen gehören.
- Die Zeichnung hat einen Text («Profil: noch 25 %»). Balken und km daneben sagen dasselbe in Zahlen.
- Die Blöcke senken sich in einer halben Sekunde, wenn sich die km ändern; bei «Bewegung reduzieren» am Gerät sofort.

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeile wird um die Zeichnung höher (rund 30 px).

## Selbst entschieden
- Die Zeichnung zeigt den Anteil der verbrauchten Lebensdauer (gleiche Zahl wie der Balken, also auch bei einer eigenen Lebensdauer oder einer Messung), nicht eine echte Profiltiefe.
- Nur für Reifen; Kette, Beläge und andere Teile bleiben beim Balken.
- Ohne Startwert (unbekannt) gibt es keine Zeichnung, wie es auch keinen Balken gibt.
- Keine neue Funktion im Sinn der Fertig-Regel, daher kein `features.js`-Eintrag.
- `docs/app-stand.md` liegt noch nicht in `main`; die Zeile kommt dazu, sobald die Datei da ist.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Neuer Schwung» / Velo-Momente: Idee 16 gebaut. Damit ist Paket C (22, 21, 12, 17, 16) komplett.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos › Pflege › Verschleiss eines Velos mit Reifen und Startwert öffnen: die Zeile «Reifen + Dichtmilch» zeigt Profilblöcke.
2. Vergleiche mit dem Balken darüber: je voller der Balken, desto flacher die Blöcke.
