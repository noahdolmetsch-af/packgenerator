# Ausprobieren: Ziele der Zeitraum-Zeilen nachgeführt

PR #? · 25.11.2026 · Reparatur mit Vorrang (Bündler, gemeldet vom Thread «Tests schneller»): der Test `ausprobieren.spec.js` Teil 3 war seit «Auswerten › Übersicht: Antwort für heute zuerst» rot.

Nichts Sichtbares geändert, nur das Ziel zweier Neuigkeits-Zeilen.

## Was ist neu
- Die zwei Zeilen der Neuigkeit «Ein Zeitraum für Analyse» (`src/lib/news/zeitraum-auswerten.js`) zeigen auf `#/auswerten/uebersicht`. Dort steht der Zeitraum seit der letzten Änderung als eine Zeile mit «Ändern»: die erste Zeile tippt jetzt zuerst «Ändern» und zeigt dann den Schalter, die zweite zeigt die Zeile «Zeitraum» (der Satz, was der Zeitraum betrifft, steht im «?»-Fenster der Seite, ein eigener Hinweis ist nicht mehr da). Der Test wurde nicht gelockert.

## Was fällt weg oder rutscht tiefer
- nichts
