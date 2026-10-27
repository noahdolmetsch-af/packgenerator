# Kleine Zahlen korrigiert

PR #? · 27.10.2026 · Auftrag: Noah 26.10.2026 20:31 «1a» alle B-Fehler aus dem UI-Test 0.205 (Thread «Testen komplette App mit Fehlerliste»)

## Was ist neu
- Strom: «20 000 mAh» (Leerzeichen zwischen den Zifferngruppen) zählt als 20'000 mAh statt geschätzt 10'000 (`mahFromName` in src/lib/power.js).
- Wi gaht's? › Deine 15 Fragen: «Morgen · 6 Fragen am Tag» statt «6 Tipps» (4/5 und 12/13 wechseln sich ab).
- Meditation: ein Haken ohne Minuten zeigt in «Letzte Sitzungen» «abgehakt» statt «0′», die Seite danach «Abgehakt, ohne Minuten.» statt «0 Minuten.».
- Einkaufsliste: Ist die eigene Liste leer, aber die Tour hat Dinge, steht «Deine eigene Liste ist leer. Für die Tour … stehen unten N Dinge bereit.»; der Ort heisst richtig «Packen › Einkaufs- und Ladeliste».
- Bausteine prüfen: Der Knopf sagt «Bausteine prüfen · N mit Vorschlägen», die Schrittzeile nennt dieselbe Zahl, der Überblick zählt 1, 2, 3 statt 5–10, und «neu geordnet» steht nur, solange Vorschläge offen sind. Kein Schema-Wechsel.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- «Tipps» heisst jetzt «Fragen am Tag», weil die Zahl zählt, wie viele Fragen pro Tag kommen (nicht alle 7).
- Der Befund «Normalwert 48 gegen 52» (G3-07) liess sich im Code nicht finden: Satz und Grafik lesen dieselbe Zahl. Darum keine Änderung dort.
- Welche Dinge in die Tour-Einkaufsliste kommen (Flaschen), bleibt wie es ist; das betrifft Packen.

## Entscheide (für decisions.md)
- 27.10.2026: Kleine Zahlen korrigiert (UI-Test 0.205 T12), Noah «1a» alle B-Fehler.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Test 0.205 (Ziel Alltag): T12 erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material › Strom: Eine Powerbank «… 20 000 mAh» zeigt 20'000 mAh.
2. Bausteine: Der Knopf sagt «Bausteine prüfen · N mit Vorschlägen»; der Überblick zählt 1, 2, 3.
