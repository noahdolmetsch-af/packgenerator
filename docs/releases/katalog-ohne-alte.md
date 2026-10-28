# Ein aufgeräumter Katalog

PR #<Nummer> · 27.10.2026 · Auftrag: Noah «1a 2a 3a», hier Frage 3 (Thread «332 Use Cases sichtbar machen»)

## Was ist neu
- Vier Funktionen, die bewusst weggelassen sind, stehen nicht mehr in «Was die App alles kann»: Shop ohne Gebühren, Rechnungen mit QR-Rechnung und TWINT, Rechnungen zu zahlen, Angebote.
- Versteckte Funktionen laut Wächter: 53 → 49 (`MAX_GAPS` in `tests/heimat.test.js`).

## Was fällt weg oder rutscht tiefer
- Die vier Einträge im Katalog (mit Handbuch- und «So geht's»-Text). Vorher: im Katalog, «Ausprobieren» führte zu einer Seite ohne Menü-Eintrag. Jetzt: kein Eintrag. Noah hat dem mit «3a» zugestimmt.

## Selbst entschieden
- Die Seiten selbst (Shop, Rechnungen, Angebote) bleiben im Code und sind nur noch über ihre direkte Adresse erreichbar; sie zu löschen ist ein eigener Schritt, falls Noah das will.
- Die deutschen Texte der vier Einträge bleiben im Wörterbuch, weil die Seiten sie noch nutzen.

## Entscheide (für decisions.md)
- 27.10.2026: Bewusst weggelassene Funktionen stehen nicht im Katalog (Noah «3a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- 332 Use Cases sichtbar: noch 49 versteckt; als Nächstes 30 Katalog-Namen angleichen (Frage 1) und ein Satz «wann es erscheint» für 17 Lage-Funktionen (Frage 2).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne «Was die App alles kann» und suche «Shop»: kein Eintrag «Shop ohne Gebühren».
2. Suche «Rechnung» und «Angebote»: auch diese Einträge sind weg.
