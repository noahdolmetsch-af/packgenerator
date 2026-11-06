# Mit der Tastatur zum Inhalt springen

Auftrag: Noah 06.11.2026 «3a» (Etappenbericht 6, Verbesserung für die Tastatur).

## Was ist neu
- Der erste Tab-Halt ist jetzt ein Knopf «Zum Inhalt springen» (`src/lib/nav/SkipLink.svelte`, eingebaut in `src/App.svelte`). Er ist nur sichtbar, solange er den Fokus hat.
- Enter setzt den Fokus in den Seiteninhalt (`main`); das nächste Tab geht dann in die Seite statt durch Menü und obere Leiste.
- Ein Knopf und kein Link, weil die App über den Adress-Teil nach `#` navigiert und ein Link die Adresse ändern würde.
- Test `tests/e2e/skip-link.spec.js`: rot ohne den Knopf, grün mit ihm.

## Was fällt weg oder rutscht tiefer
- nichts (für Maus und Touch unsichtbar, der Tab-Weg hat einen Halt mehr am Anfang)

## Selbst entschieden
- Text «Zum Inhalt springen» über `t()`, deutsch in `i18n/de/shell.js`.
- Keine Änderung in `docs/app-stand.md` (keine neue Seite, kein neuer Link).

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick Etappe 6: Antwort 3a umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Computer einmal Tab drücken: oben links erscheint «Zum Inhalt springen».
2. Enter drücken: das nächste Tab landet im Seiteninhalt.
