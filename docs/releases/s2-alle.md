# Weiche Karten auf Planen, Touren, Auswerten und Aktiv

02.11.2026 · Auftrag: Noah 26.10.2026 «1a» (Stil S2) und 02.11.2026 «können wir daraus 1 PR machen ohne bilder?»

## Was ist neu
- Auf allen Seiten von Planen, Touren, Auswerten und Aktiv haben die Karten keinen grauen Rahmen mehr, sondern einen weichen Schatten und runde Ecken (18 px), wie auf Heute, Velos, Packen und Planen › Woche.
- Technisch: `main` trägt zusätzlich `data-s2-place` (der Ort der Seite); `src/app.css` setzt den Stil für die Orte `week`, `trips`, `analysis`, `active`. Ein neuer Reiter in einem dieser Orte bekommt den Stil von selbst.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Ohne Bilder, auf Noahs Wunsch (02.11.2026); die Prüfschritte sagen, wo man schauen kann.
- Nach Orten statt nach einzelnen Seiten, damit nichts vergessen geht. Ich (Ausrüstung) und Heute bleiben, wie sie sind.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Neuer Schwung, Stil S2: Planen, Touren, Auswerten, Aktiv dazu. Offen bleibt «Ich».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen, Touren, Auswerten und Aktiv nacheinander öffnen: die Karten haben keinen grauen Rahmen.
2. Alles ist da, wo es war.
