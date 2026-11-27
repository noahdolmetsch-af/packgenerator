# Favoriten: ruhigere Karten, Farbe pro Bereich

PR #1858 · 27.11.2026 · Auftrag: Noah «1, 2, 3, 4» (Punkte 2 und 4) und Freigabe der Bilder 27.11.2026 im Thread «Lieblingsinhalte besser sichtbar machen»

## Was ist neu
- Die Karten der Kachel «Favoriten» auf Heute sind niedriger (80 px). Die zweite Zeile steht nur noch, wenn du selbst eine Notiz an den Favoriten geschrieben hast; der Gruppenname steht nicht mehr dort (`favCards` in `src/lib/quick/favcards.js`).
- Jedes Symbol trägt die Farbe seines Bereichs (Tour, Packliste, Wissen, Velo, Natur, sonst die Hauptfarbe), über einen Farbwert pro Karte (`TONE` in `src/lib/home/PinsTile.svelte`).
- Auf Heute zeigt die Ebene der Sterne (`PinMarks.svelte`) keine Sterne mehr an Karten, weil dort die Kachel «Favoriten» steht und die Sterne nur kurz aufblitzten, während die Seite zeichnete.

## Was fällt weg oder rutscht tiefer
- Der Gruppenname unter dem Favoriten-Namen fällt weg. Sterne an Karten auf Heute fallen weg (auf allen anderen Seiten bleiben sie).

## Selbst entschieden
- Farben aus den bestehenden Stufen-Farben (`--l1` bis `--l4`, `--hi`, `--ink-2`), keine neuen Farbwerte.
- Keine Sterne auf Heute: Antwort an den Wackel-Thread, der das Aufblitzen im Test gesehen hatte (Test «pins on the cards» läuft seit PR 1855 auf der Seite Notizen).

## Entscheide (eigene Datei `docs/decisions/favoriten-ruhiger-farbe.md`)
- 27.11.2026: ruhigere Karten und Farbe pro Bereich; keine Sterne auf Heute

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung. Weiter mit «Karten mit Leben» (Packliste x von y, Pflege-Kilometer) und Schritt 4 «Suche».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen und die Favoriten gleich unter der Kopfzeile ansehen (Handy und Computer).
2. Die Karten sind niedrig, die zweite Zeile steht nur bei eigener Notiz, die Symbole haben je nach Bereich eine andere Farbe.
3. Auf Heute erscheint an keiner Karte ein Stern; auf einer anderen Seite (zum Beispiel Notizen) schon.
