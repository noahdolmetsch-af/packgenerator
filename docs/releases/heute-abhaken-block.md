# Heute abhaken als erster Block auf Heute

Auftrag: Noah 23.11.2026 «1a 2a» (Thread «Prototyp»), dazu der Sprung «n Dinge dran» (Plan «ganze App»)

## Was ist neu
- Der Block **«Heute abhaken»** (`src/lib/home/HakenBlock.svelte`, Rechnung `src/lib/home/haken.js`) steht als **erste Kachel** auf Heute, vor dem Körper-Band. Er zeigt deine Aktivitäten als kleine Kacheln (Handy 4, Computer 8, in der Reihenfolge von «Heute abhaken»), ein Tipp hakt ab, «Rückgängig» nimmt zurück. Oben steht «n offen» (dieselbe Zahl wie am Menüpunkt «Plan», Abstimmung mit dem Menü-Thread) oder «Alles erledigt», «Alle ›» öffnet die Seite «Heute abhaken» (`#/flow`).
- Habit-Karten (Meditation und Co.) stehen weiter als Karten; eine leise Zeile nennt, was dort schon steht. «Aktiv heute» zeigt keine Kachel doppelt.
- Die Wand bekommt einmal die Version 23: ältere Wände rücken den Block an die erste Stelle (`withHaken` in `src/lib/home/tiles.js`); er lässt sich wie jede Kachel verschieben und ausblenden.
- Die Zeile unter dem Gruss «n Dinge dran» ist ein Link und springt zum Block «Jetzt dran».
- Ohne Aktivitäten zeigt der Block nichts.

## Was fällt weg oder rutscht tiefer
- Nichts. Das Körper-Band rutscht an die zweite Stelle (vorher erste). Der Chip «Abhaken» und die Habit-Karten bleiben.

## Selbst entschieden
- **Reihenfolge:** die Kacheln bleiben, wie sie sind; nach dem Abhaken springt nichts um (kein Nachsortieren).
- **Anzahl:** 4 am Handy, 8 am Computer, der Rest über «Alle ›».
- **Fertig-Regel:** Seite und Absprung: der Block selbst (Zeile Heute in `docs/app-stand.md`); Leer-Zustand: kein Block ohne Aktivitäten, die Seite «Heute abhaken» erklärt es; nächster Schritt: das «Rückgängig»; keine neue Funktion in `features.js`.
- Tests: `tests/haken.test.js`, `tests/e2e/heute-abhaken.spec.js`; Reihenfolge-Annahmen in älteren Tests auf Absicht angepasst (erste Kachel ist jetzt «haken»).

## Entscheide (für decisions.md)
- `docs/decisions/heute-abhaken-block.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: «Heute abhaken» ist der erste Block, mit deinen Aktivitäten.
2. Eine Kachel antippen: abgehakt, «Rückgängig» erscheint; tippen: wieder offen.
3. «Alle ›» tippen: die Seite «Heute abhaken» öffnet sich.
4. Unter dem Gruss «n Dinge dran» tippen: die Seite springt zu «Jetzt dran».
