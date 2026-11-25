# CI: Aufzeichnung nur noch beim Wiederholen eines Tests

PR #1783 · 24.11.2026 · Auftrag: Noah «1 2 3 4 5», Punkt 5 «Schnellere Tests» (Thread «Tests schneller machen»)

## Was ist neu
- In der CI nimmt Playwright den Ablauf (Trace) nur noch auf, wenn ein Test fehlschlägt und ein zweites Mal läuft (`trace: 'on-first-retry'`). Vorher wurde jeder Test aufgenommen und die Aufnahme bei Erfolg verworfen.
- Gemessen an 35 Handy-Tests auf 4 Prozessorkernen (wie ein GitHub-Rechner): 431 s mit, 374 s ohne Aufnahme, also etwa 13 % weniger Zeit pro Teil.
- Nichts ändert sich in der App. Lokal bleibt `retain-on-failure`.

## Was fällt weg oder rutscht tiefer
- nichts. Ein fehlgeschlagener Test lässt weiter seine Aufnahme zurück, weil die CI ihn einmal wiederholt (`retries: 1`).

## Selbst entschieden
- Mehr Prozesse pro Rechner (`--workers=4` statt 2) bringen nichts: gleiche 35 Tests 374 s mit 2, 383 s mit 4. Die Tests sind rechenlimitiert. Darum bleibt der Standard.
- Die App einmal bauen und an alle Teile weitergeben: nicht gemacht, die Teile müssten dann auf den Bau warten und würden später fertig.

## Stand im Plan
- Stau-Regel 5 «Tests schneller machen»: erster, sicherer Schritt. Option A (volle Prüfung nur einmal pro schwerem PR, am Schluss) wartet auf Noahs Antwort.

## Prüfschritte (nach dem Merge)
1. In Actions den nächsten PR-Lauf öffnen: die Handy-Teile brauchen etwa 10 % weniger Zeit als bisher.
2. Fällt ein Test durch, liegt bei den Ergebnissen weiter eine Aufnahme (`trace.zip`) vom zweiten Versuch.
