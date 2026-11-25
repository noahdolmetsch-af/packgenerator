# Aktionen in Auswerten: die Löschen-Regel (Regeländerung)

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «1-5a» (Prüfung «Aktionen in Auswerten», Entscheid 4a), Teil 4 von 5

**Regeländerung in `CLAUDE.md` (und `docs/arbeitsweise.md`)**, ausdrücklich und mit Noahs Wort als Beleg: «4a», 23.11.2026 19:49 (Quelle: `docs/decisions/loeschen-rueckgaengig.md`). Die Regel «Löschen fragt zuerst und bietet Rückgängig» wird ersetzt durch:

- Was man schnell wieder anlegt (Idee, Lebensphase, Gewicht, ein Ort in einer Liste, ein Foto): sofort weg, «Rückgängig» 8 Sekunden.
- Dinge mit Verlauf (eine Frage mit Antworten, ein Bereich mit Inhalt, ein Velo, eine Tour): ein Fenster fragt zuerst, danach «Rückgängig».
- `confirm()` bleibt verboten; im Zweifel fragen.

Ziele von Noah (23.11.2026 18:09): **Klarheit** (die Regel sagt, was die App wirklich tut) und **Auffindbarkeit** (nichts geht ohne Weg zurück verloren). Leitfaden `docs/leitfaden.md`: «Eine App, die mich im Alltag unterstützt».

## Was ist neu
- Regeltext in `CLAUDE.md` und `docs/arbeitsweise.md`; Entscheid und Einordnung der Löschen-Stellen in Auswerten und «Wi gaht's?» in `docs/decisions/loeschen-rueckgaengig.md`.
- Kein Code: die Einordnung zeigt, dass keine Stelle in Auswerten oder «Wi gaht's?» ohne Rückfrage **und** ohne Rückgängig löscht; das gelebte Verhalten entspricht der neuen Regel.

## Was fällt weg oder rutscht tiefer
- Die alte Regel «Löschen fragt zuerst» in `CLAUDE.md` fällt weg (ersetzt wie oben). In der App ändert sich nichts Sichtbares.

## Selbst entschieden
- Der Gipfelbuch-Ort (hat Besuche) bleibt bei sofort weg + Rückgängig-Zeile ohne Zeitgrenze; die Einordnung steht im Entscheid.
- Stellen ausserhalb von Auswerten und «Wi gaht's?» werden nicht umgebaut.
- Kein Daten-, Backup- oder `api/`-Eingriff.

## Entscheide
- Noah 23.11.2026 19:49 «4a». Siehe `docs/decisions/loeschen-rueckgaengig.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Aktionen in Auswerten»: alle fünf Teile gebaut (1 bis 5).

## Prüfschritte (nach dem Merge auf der echten Seite)
Nichts Sichtbares in der App (nur Regeltext). Zur Probe:
1. Auswerten › Ideen: eine eigene Idee entfernen: sie geht sofort weg, der Hinweis mit «Rückgängig» bleibt etwa 8 Sekunden.
2. Auswerten › Wi gaht's?: eine Frage löschen: ein Fenster fragt zuerst.
