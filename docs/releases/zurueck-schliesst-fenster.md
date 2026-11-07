# Zurück schliesst jedes Fenster

Auftrag: Noah 05.11.2026, Durchklick Etappe 6 (Querschnitt), Befund E6-001 (Klasse B).

## Was ist neu
- Auf Heute schliesst die Zurück-Taste das Fenster «Was ziehe ich an?» und lässt dich auf Heute. Vorher ging die Taste eine Seite zurück, und das Fenster verschwand mit der Seite.
- Das ••• Menü einer Zeile in Material und die grosse Kontaktkarte (Mit Freunden) tun dasselbe.
- Neuer Wächter `tests/dialog-backclose.test.js`: jedes `<dialog>` in der App braucht `use:backClose`. Ausgenommen sind zwei Fenster mit Grund: die Aufnahme (Zurück darf eine Aufnahme nicht beenden) und die Liste «In der Nähe» auf der Live-Karte (kein Modal, die Karte bleibt bedienbar). Die Ausnahmeliste darf nur kürzer werden.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Live-Liste «In der Nähe» und das Aufnahme-Fenster bleiben ohne Zurück-Eintrag (Gründe oben); Noah kann das ändern.
- Keine neuen Texte, keine Funktion: darum keine Zeile in `docs/app-stand.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick Etappe 6: Befund E6-001 behoben, der Rest steht im Etappenbericht.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen, «Was ziehe ich an?» antippen, dann Zurück: Fenster zu, du bleibst auf Heute.
2. Material öffnen, bei einer Zeile ••• antippen, dann Zurück: Menü zu, Liste bleibt.
