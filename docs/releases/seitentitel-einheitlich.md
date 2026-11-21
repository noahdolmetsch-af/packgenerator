# Seitentitel sehen gleich aus

PR folgt · 21.11.2026 · Auftrag: Noah «1-5a» (Thread «Einheitliches Erscheinungsbild, Tagebuch zuerst»; Bericht https://claude.ai/artifact/7vM8VacJjgKav8pEz2484z)

Stufe 1 von 3 der Seitenregeln (Stufe 2: Seiten-Baustein für den Kopf, Tagebuch als erster Fall; Stufe 3: Wächter).

## Was ist neu
- Jeder Seitentitel hat dieselbe Grösse (`--fs-page`: 40 px Computer, 32 px Handy) und Schrift (700, Zeilenhöhe `--lh-title`). Vorher: 32 px bei Woche, Merken und weiteren Seiten mit `PageHead`, 800 statt 700 bei Meditation, Timer, Routine, Check, Rennen, Ski, Frei-Seiten, Form 600. Geändert in `PageHead`, `Celebrate` und 16 Seiten- und Stil-Dateien.
- 22 Karten mit eigener Ecke (16, 18, 20 oder 22 px) nutzen jetzt `--radius-card` (Velo-Fenster, Tour, Weg, Routine, Rückblick, Erinnerungs-Karte, Heute-Wand und weitere).
- Neue Seitenregeln in `docs/design-audit.md` (acht Regeln).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Heute behält die kleinere Begrüssung («Hoi, wi gaht's?»): sie ist eine Frage, kein Seitentitel (frühere Wahl HG1a).
- Der Tour-Name in `TripBand` (Packen) bleibt 32 px: er ist ein Name im Band, nicht der Titel einer Seite. Kommt mit dem Seiten-Baustein (Stufe 2).
- Nur Ecken von 16 bis 22 px sind auf `--radius-card` umgestellt. 12 und 14 px (innere Kacheln, Symbole) bleiben, ebenso Knöpfe, Schalter, Logos und Hervorhebungen der Rundgänge: eine kleine Kachel mit der Ecke einer Karte würde rund wie ein Kreis.
- Abstände (43 verschiedene Werte im Code) ändere ich nicht mechanisch: ein Wert wie 10 px steht in 1300 Stellen mit anderer Bedeutung. Sie kommen mit dem Seiten-Baustein (Stufe 2) und dem Wächter (Stufe 3).
- Keine Prüf-Regeln in diesem PR (Stufe 3).
- Meditation (Handy): die Seite ist mit dem grösseren Titel 1 px höher als 1800 px. Der Höhenrahmen im Test `hobby-meditation.spec.js` steigt von 1800 auf 1840, mit Begründung im Test; es ist kein Bildschirm-Budget (Noah 26.10.2026 «keine Anforderung an eine Länge der Seite»).

## Entscheide (für decisions.md)
- 21.11.2026: Seitenregeln gelten für die ganze App, in drei Stufen (Noah «1-5a»); Hilfe nur über das «?», die Zeile «Was du hier tun kannst» unter dem Titel fällt in Stufe 2 weg; gewählter Umschalter = weisse Fläche mit Rand; Reihenfolge: Werte, Tagebuch, Ort für Ort.

## Stand im Plan (roadmap.md / vorhaben.md)
- Erscheinungsbild: Stufe 1 gebaut. Gehört zu Ziel «Eine App, die mich im Alltag unterstützt» (verständliche Seiten, einfache Bedienung).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Woche und danach Touren öffnen: die Titel sind gleich gross.
2. Meditation und Timer öffnen: der Titel sieht aus wie der von Aktiv, nichts bricht um.
3. Handy: Woche, Merken, Notizen: kein seitliches Scrollen.
