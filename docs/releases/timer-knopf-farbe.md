# Timer: Knöpfe gut lesbar

PR #<Nummer> · 19.11.2026 · Auftrag: Noah «mache einen kompletten test der website … behebe dabei kleine fehler direkt» (Thread «Ganze Website testen und Fehler beheben»)

## Was ist neu
- Timer: Der grüne Knopf «Start» neben der getippten Zeit, «Abhaken» (Aktivität) und im Timer-Log «Speichern» hatten dunkelgrauen Text auf Grün (Kontrast 1,8 : 1, im dunklen Modus 1,3 : 1). Ursache: eine Regel `.sm` für kleine graue Sätze (`<p class="sm">`) traf auch die Knöpfe mit der Klasse `sm`. Die Regel gilt jetzt nur für `p.sm` (`Timer.svelte`, `TimerLog.svelte`). Die Knöpfe haben wieder die Farben von `.btn.hi`; der Aussenabstand der Regel fällt bei ihnen auch weg. Das Tastatur-Symbol vor dem Feld bleibt grau, das Start-Symbol im Knopf ist jetzt weiss (`.typed > svg`).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- `TimerFaces.svelte` hat dieselbe Regel, aber keine Knöpfe mit `sm`; dort nichts geändert.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Timer öffnen: Der grüne Knopf «Start» neben «Zeit eintippen» hat weissen Text.
2. Timer-Log (`#/timer/log`): einen Eintrag antippen; «Speichern» hat weissen Text.
