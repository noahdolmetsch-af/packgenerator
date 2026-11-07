# Aufräumen: Probe-Tests von Etappe 5 aus dem Repo

PR · 06.11.2026 · Auftrag: Noah «1a 2a 3a 4a» (Thread «Durchklicken Etappe 5»), Aufräumen vor dem Lang-Wort-Roboter

## Was ist neu
- Der Ordner `tests/e2e/tmp-durchklick/` ist weg. Er enthielt Probe-Skripte von Etappe 5 (Durchklicken, Formulare mit langen Wörtern), die mit PR 990 aus Versehen mit ins Repo kamen.
- Nichts in der App ändert sich. Es sind keine echten Daten darin (die Skripte lesen ein Backup nur über eine Umgebungsvariable).

## Was fällt weg oder rutscht tiefer
- Die Probe-Skripte. Der nächtliche Lang-Wort-Roboter (eigener PR) ersetzt sie.

## Selbst entschieden
- Keine «Was ist neu»-Datei, weil in der App nichts sichtbar ist.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen. Die App sieht gleich aus.
