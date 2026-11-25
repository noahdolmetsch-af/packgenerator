# Hinweis mit zwei Tasten: auf dem Handy nicht mehr eine schmale Säule

PR #1783 · 24.11.2026 · Reparatur eines Fehlers aus «Aktionen 3» (#1673), beim Live-Test auf dem Handy gefunden. Auftrag: Noah «1-5a» (Prüfung «Aktionen in Auswerten»); Regel: main-Fehler zuerst.

Ziele von Noah (23.11.2026): **Klarheit** (der Hinweis ist lesbar) und **Auffindbarkeit** («Rückgängig» und «Ansehen» sind sichtbar und gut zu treffen). Leitfaden: «Eine App, die mich im Alltag unterstützt».

## Was ist neu
- Der Hinweis unten («Frage gespeichert. Sie kommt täglich · 20:00.» mit «Rückgängig» und «Ansehen») bekommt auf schmalen Geräten (bis 480 px) zwei Zeilen: oben der Text über die ganze Breite, darunter die Tasten. Vorher blieb dem Text neben zwei Tasten fast keine Breite, er brach nach jedem Buchstaben um und der Hinweis war über den halben Bildschirm hoch.
- Test: `tests/e2e/abfragen.spec.js` prüft auf dem Handy, dass der Text breiter als 150 px ist und der Hinweis nicht höher als 160 px (ohne die Reparatur: Breite 0).

## Was fällt weg oder rutscht tiefer
- nichts. Hinweise mit nur «Rückgängig» sehen auf dem Handy fast gleich aus (der Text bekommt oben die ganze Zeile).

## Selbst entschieden
- Bis 480 px; auf dem Computer bleibt alles in einer Zeile.
- Kein Daten-, Backup- oder `api/`-Eingriff.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Handy: Auswerten › Wi gaht's? › «Eigene Frage anlegen», speichern: der Hinweis liest sich in einer Zeile Text, darunter «Rückgängig» und «Ansehen».
