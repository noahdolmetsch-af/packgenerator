# Aktionen in Auswerten: «Rückgängig» 8 Sekunden

PR #1783 · 23.11.2026 · Auftrag: Noah «1-5a» (Prüfung «Aktionen in Auswerten», Entscheid 3a), Teil 1 von 5

Ziele von Noah (23.11.2026 18:09): **Klarheit** (man sieht, was passiert ist, und kann es lesen, bevor es weg ist) und **Auffindbarkeit** (der Weg zurück bleibt lang genug da).

## Was ist neu
- «Rückgängig» bleibt auf jedem Hinweis **8 Sekunden** statt 4 (gemessen vorher: 3,3 bis 3,5 s bei Gewicht, Idee, Marker, Phase).
- Der Hinweis hält an, solange die Maus oder ein Finger darauf ist oder er den Fokus hat; die dünne Linie hält mit an, danach läuft der Rest der Zeit weiter. Gilt für den Hinweis unten (`offerDone`, `src/lib/ui/rename.svelte.js`) und den Hinweis der Flow-Seiten (`FlowLayer.svelte`).
- Eine Stelle für die Zeit: `UNDO_MS` in `src/lib/ui/undo.js`. Alle Hinweise lesen sie; die festen Zahlen in `Learned.svelte`, `flow/ui.svelte.js` und `Reminders.svelte` sind weg. Die Sätze «Du kannst es 4 Sekunden lang zurückholen» sagen jetzt 8 Sekunden (alle Stellen und Deutsch).

## Was fällt weg oder rutscht tiefer
- nichts. Hinweise ohne «Rückgängig» bleiben, wie sie waren (8 s auf den Flow-Seiten).

## Selbst entschieden
- Beim Festhalten läuft die Zeit mit dem Rest weiter (nicht neu von vorn), damit der Hinweis nicht ewig stehen bleibt, wenn der Finger nur kurz darauf war.
- Hinweise, die eine Seite selbst zeichnet (Gewicht, Suche, Reise-Notiz), nutzen schon `UNDO_MS` und werden 8 s lang; ihr Festhalten bleibt wie bisher (kein Pausieren) – nur die zwei gemeinsamen Hinweise pausieren.
- Kein Daten-, Backup- oder `api/`-Eingriff; die Texte der Hinweise («71.4 kg … gespeichert») sind unverändert.

## Entscheide
- Noah 23.11.2026 19:49 «1-5a», Entscheid 3a. Siehe `docs/decisions/rueckgaengig-acht-sekunden.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Aktionen in Auswerten»: Teil 1 gebaut; offen: «Jetzt nicht» mit Hinweis, neue Frage mit Hinweis, Löschen-Regel, «Stufen ändern».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Etwas Kleines löschen (zum Beispiel ein Gewicht): der Hinweis mit «Rückgängig» bleibt etwa 8 Sekunden.
2. Maus (oder Finger) auf den Hinweis: die Linie hält an, der Hinweis bleibt, bis du loslässt.
3. «Rückgängig» antippen: die Sache ist wieder da.
