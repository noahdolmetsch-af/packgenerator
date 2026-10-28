# Kurze Schritte

PR #276 · 27.10.2026 · Auftrag: Noah 26.10.2026 23:16 «1b nur die schrittleiste (mobile und computer)» (Thread «Testen komplette App mit Fehlerliste»)

## Was ist neu
- Die Schrittleiste einer Tour (ui/StepBar.svelte, auch auf den Zwischenseiten) zeigt die kurzen Namen Plan · Pack · Live · Review · Analyse (`STEP_BAR` in src/lib/stepbar.js, deutsch dieselben Wörter, eigene Schlüssel `…|bar`).
- Knöpfe und Texte behalten ihre Namen aus tabs.js (`TAB_NAMES`, zum Beispiel «Weiter zu Packen»). Kein Schema-Wechsel.

## Was fällt weg oder rutscht tiefer
- nichts. Die Leiste heisst kürzer; alle Wege bleiben.

## Selbst entschieden
- Die Zwischenseiten («Gepackt», «Tour beendet») zeigen dieselbe Leiste, also auch die kurzen Namen.
- Tests, die in der Leiste tippen, lesen die Namen aus `STEP_BAR`.

## Entscheide (für decisions.md)
- 27.10.2026: nur die Schrittleiste bekommt kurze Namen (Noah «1b»), Knöpfe bleiben deutsch.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Test 0.205 (Ziel Touren): Schrittleiste erledigt; T3–T7 folgen als eigene kleine PRs.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Tour öffnen: Die Leiste oben zeigt Plan · Pack · Live · Review · Analyse, auf Handy und Computer.
2. Auf «Pack» tippen: Packen öffnet; der Knopf unten heisst weiter «Weiter zu …» auf Deutsch.
