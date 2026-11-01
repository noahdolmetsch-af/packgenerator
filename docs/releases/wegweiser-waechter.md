# Test «Absprung»: jede Funktion braucht einen Weg von einer Seite

PR #… · 01.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» und «1-5a» (Thread «Entdeckbarkeit versteckter Funktionen planen»)

## Was ist neu
- Nichts Sichtbares. Ein neuer Test prüft, dass jede Funktion des Katalogs mindestens einen Link von einer Seite der App hat, nicht nur aus Katalog, Suche, Quick Links, Handbuch, Tipps oder Neuigkeiten.
- Die 44 Funktionen ohne solchen Link stehen in `NO_JUMP` (`src/lib/know/absprung.js`), sortiert nach dem PR, der ihnen einen Absprung gibt. Die Liste darf nur kürzer werden. Eine neue Funktion ohne Link macht den Test rot.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Ein Link zählt, wenn der Pfad der Funktion als Text im Code steht (auch mit `?…`). Links, die erst beim Laufen zusammengesetzt werden (die Sammelseiten Werkzeugkasten, Ruhiger, Freie Zeit), zählen nicht; genau diese Funktionen sollen einen zweiten Weg bekommen.
- Tabs der Navigation zählen als Weg, die Finde-Orte (Katalog, Suche, Quick Links, Handbuch, Tipps, Neuigkeiten, Entdecken) nicht.
- Funktionen mit Aktion statt Seite, mit der Startseite oder mit Platzhalter (`{bike}`) prüft der Test nicht.

## Entscheide (für decisions.md)
- 01.11.2026: Wegweiser statt Katalog, Absprung-Pflicht mit Test, Inhalte auf der Seite (siehe decisions.md).

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 «Wegweiser statt Katalog»: PR 1 von 10.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen: in der App ändert sich nichts.
2. Auf GitHub ist der Check «build» grün.
