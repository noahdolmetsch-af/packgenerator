# Leere Seiten zeigen eine Velo-Szene

PR (diese Änderung) · 03.11.2026 · Auftrag: Noah «b» (Paket D, Idee 19 «Leere Seiten mit Velo-Szenen»; Thread «Durchgehen: offene Fragen einzeln»); Ziel 5 «Alltag»

## Was ist neu
- Der Baustein für leere Ansichten (`Empty.svelte`) zeichnet statt des Blattes eine kleine Szene aus der Velo-Welt: **ein Velo an der Wand** (Standard, zum Beispiel Ausrüstung, Notizen), **ein Zelt unter Sternen** (Touren, Packen, Träume, Rückblick, Reise, Woche) oder **ein leerer Velo-Ständer** (Velos und Pflege).
- Die Szene wählt der Bereich der Seite (`src/lib/ui/emptyscene.js`); eine Seite kann mit `scene="…"` eine feste wählen.
- Die Linien zeichnen sich beim Öffnen von selbst (wie das Blatt vorher). Bei «Bewegung reduzieren» steht die Zeichnung still.
- Das Symbol in der Blase oben rechts, der Satz und die Knöpfe bleiben, wie sie waren. Das Murmeltier aus #772 sitzt weiter links daneben.

## Was fällt weg oder rutscht tiefer
- Das gezeichnete Blatt mit den zwei Linien fällt weg; an seiner Stelle steht die Szene.

## Selbst entschieden
- Nur drei Szenen (die drei aus der Idee), eine pro Bereich, damit eine Seite immer dasselbe zeigt.
- Dieser PR baut auf #772 (Murmeltier, ändert dieselbe Datei `Empty.svelte`) auf und merged erst danach.
- `docs/app-stand.md` ist noch nicht auf `main` (PR #742 offen); die Zeile folgt nach dessen Merge.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket D «Laden, Leere und Wetter»: Idee 19 gebaut (Idee 14 in #776; 15, 10, 20 folgen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen, solange keine Tour da ist (oder eine leere Liste suchen): ein Zelt unter Sternen.
2. Eine leere Liste unter Ausrüstung: ein Velo an der Wand; bei den Velos ohne Eintrag: ein leerer Ständer.
3. «Bewegung reduzieren» am Handy einschalten: die Zeichnung steht still.
