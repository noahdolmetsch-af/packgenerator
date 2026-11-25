# Meine Sportarten baut etwas schneller auf

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «a: Schwerste Reiter einzeln» (Thread «Beheben: Verzögerung bei Eingaben und Tabs»)

## Was ist neu
- Aktiv › Meine Sportarten: Das Feld «Alle Sportarten auf einen Blick» (die Quadrate pro Tag) steht zugeklappt am Seitenende. Bisher wurden alle Quadrate trotzdem beim Öffnen der Seite gebaut (jede Sportart × 14 Tage). Jetzt entstehen sie erst, wenn du das Feld öffnest.
- Die Tagesnamen auf den Quadraten (Tooltip) werden mit einem gemeinsamen Formatierer erzeugt statt einem pro Quadrat.
- Gemessen (4× langsamer Prozessor, 390 px, 8 Wechsel): Seite steht nach ca. 860 ms statt ca. 940 ms; rund 260 Elemente weniger. Der Rest der Zeit ist verteilt (Seitenaufbau, Datenabfragen); weitere Schritte folgen als eigene PRs.

## Was fällt weg oder rutscht tiefer
- nichts. (Das Feld ist am gleichen Ort; beim Aufklappen erscheinen die Quadrate einen Augenblick später als vorher, weil sie jetzt erst dann gebaut werden.)

## Selbst entschieden
- Das Feld baut seinen Inhalt beim ersten Öffnen und behält ihn danach (kein erneuter Aufbau beim Zuklappen).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Verzögerung beheben, Reiter einzeln: Meine Sportarten (Reiter 1). Bericht: notes/eingabe-tempo-2026-11-05/README.md.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meine Sportarten öffnen: die Liste deiner Sportarten ist sofort da.
2. Ganz unten «Alle Sportarten auf einen Blick» antippen: die Quadrate pro Tag erscheinen wie bisher.
