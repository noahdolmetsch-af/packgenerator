# Geist geschlagen oder nicht

PR #<offen> · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4b 5b» (Thread «Klären: Geisterfahrten im Frontend», Frage 2)

## Was ist neu
- **Zeile unter den Zahlen einer Fahrt:** «Geist geschlagen» (oder «Auf Augenhöhe mit deinem Geist», «Geist diesmal nicht geschlagen») mit Begründung, zum Beispiel «7 % mehr Watt pro Schlag als am 13.10.». Ein Tipp springt zur Karte und lässt sie leuchten.
- **Kasten oben in der Karte** «Schlag deinen Geist» mit demselben Ergebnis, und ein **Haken** bei jedem Wert, bei dem diese Fahrt besser war (mehr Watt, weniger Puls, mehr Watt pro Schlag, schneller, kürzere Zeit, weniger Nachlassen).
- Ein Satz unter der Tabelle sagt, was «geschlagen» heisst: mehr Watt pro Schlag, oder gleiche Leistung bei weniger Puls.

## Was fällt weg oder rutscht tiefer
- nichts. Der Satz «Gleiche Leistung wie dein Geist, 4 Schläge weniger Puls.» steht jetzt im Kasten statt als lose Zeile.

## Selbst entschieden
- Die Zeile erscheint nur, wo die Karte erscheint: gibt es keinen Geist, oder hast du die Karte in «Analysen anpassen» ausgeblendet, steht keine Zeile da.
- Nur ✓ bei dem besseren Wert, kein ✗ beim schlechteren: die App beobachtet, sie bewertet den Tag nicht.
- «Nicht geschlagen» heisst «diesmal»; die Karte sagt weiter, eine bessere Zahl sei kein Auftrag, härter zu fahren.
- Neue Funktionen in `ghost.js`: `resultOf`, `betterOf`, `ghostCase` (Karte und Zeile rechnen dasselbe).
- Kein Schema und kein Backup-Format geändert.
- Fertig-Regel: Seite ja (Zeile und Karte auf der Fahrt), Absprung ja, leerer Zustand: ohne Geist keine Zeile (wie die Karte), «Gut zu wissen» entfällt.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Geist-Karte (Cockpit-Idee 4): Schritt 2 von 5 (Ergebnis). Weiter: Texte, Geist vor der Fahrt wählen, Hausrunde-Satz.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Aktivitäten: eine Velofahrt mit Puls öffnen, die einen früheren Geist hat.
2. Unter den Zahlen steht eine Zeile «Geist geschlagen» (oder nicht). Tippe sie an: die Karte leuchtet.
3. In der Karte steht oben derselbe Kasten, bei besseren Werten ein Haken.
