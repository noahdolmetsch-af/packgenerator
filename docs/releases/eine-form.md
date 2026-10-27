# Eine Form

PR #? · 27.10.2026 · Auftrag: Noah 26.10.2026 20:31 «1a» alle B-Fehler aus dem UI-Test 0.205 (Thread «Testen komplette App mit Fehlerliste»)

## Was ist neu
- Training (training/week/AnaForm.svelte) und «Form und Erholung» (pages/flow/Form.svelte) lesen dieselbe Form aus form.js (`shownForm`, `formWeeksOf`): gleicher Tag, gleiche Zahlen, egal welcher Zeitraum.
- Unter der Kurve steht «Form = Fitness − Müdigkeit». Das Wort heisst überall «Müdigkeit»; der Teil der Tagesform heisst «Form-Einfluss auf heute». Kein Schema-Wechsel.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Training zeigt pro Woche einen Punkt aus derselben Tagesreihe wie «Form und Erholung» (statt eigener Wochenrechnung).
- Der Anteil an der Tagesform heisst «Form-Einfluss auf heute», damit er nicht wie eine zweite Form aussieht.

## Entscheide (für decisions.md)
- 27.10.2026: Eine Form (UI-Test 0.205 T3), Noah «1a» alle B-Fehler.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Test 0.205 (Ziel Alltag): T3 erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Training, zu «Fitness, Müdigkeit und Form» scrollen: darunter steht die Rechnung.
2. Auswerten › «Form und Erholung»: dieselbe Form-Zahl wie auf Training.
