# Seitentitel im Tab: versteckte Zeile ohne Rolle «status»

Auftrag: Reparatur zu «Der Tab sagt, wo du bist» (Noah «2a», 23.11.2026).

## Was ist neu
- Nichts Sichtbares. Die versteckte Zeile, die Screenreader den neuen Seitentitel vorliest, hat jetzt nur noch `aria-live="polite"` und nicht mehr `role="status"`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Grund: Mehrere Tests (Shop, Rechnungen, TWINT, Wiegen) suchen die eine Meldung der Seite mit `getByRole('status')`; die zweite Zeile mit dieser Rolle brach sie. Die Vorlesefunktion bleibt gleich (`aria-live` genügt).
- Keine News-Datei (nichts Sichtbares), also eine Patch-Nummer.

## Entscheide
- Keine.

## Stand im Plan
- Nichts geändert.

## Prüfschritte
1. Shop: Produkt in den Shop legen, die Meldung «… ist im Shop.» erscheint.
2. Rechnungen: eine Rechnung als bezahlt markieren, die Meldung erscheint.
