# Tennis an einem Ort

PR folgt · 07.11.2026 · Auftrag: Noah «ok Mockup» (Thread «Klären Flyer für Tennisstunden»), erster Teil von sieben (A)

## Was ist neu
- Neuer Ort «Tennis» (`#/me/tennis`): oben die Tabs «Angebote» und «Kunden». Die Seite zeigt wie bisher die Angebote, die Kundenliste ist der zweite Tab.
- Die Brotkrumen auf Angebot und Kunden führen jetzt zu «Tennis».

## Was fällt weg oder rutscht tiefer
- Der Knopf «Kunden» über der Angebotsliste fällt weg. Neu: der Tab «Kunden» in derselben Kopfzeile.
- Die Überschrift «Deine Angebote» heisst jetzt «Tennis».
- Die alten Adressen `#/me/offers` und `#/me/offers/customers` gehen weiter und zeigen dieselben Seiten. Links aus Hinweisen auf ein einzelnes Angebot (`#/me/offers/<id>`) bleiben unverändert.

## Selbst entschieden
- Zwei Tabs statt vier: «Flyer» und «Anmeldungen» aus dem Mockup kommen mit ihren eigenen PRs (B bis G), damit kein leerer Tab steht.
- Die Tabs sind die vorhandene Umschalt-Leiste (`Seg`); keine neue Funktion im Katalog, die Zeile steht in `docs/app-stand.md`.
- Kein Umzug der Daten: Angebote und Kundenliste liegen unverändert am selben Ort im Gerät (kein Schema- und kein Backup-Wechsel).

## Entscheide (für decisions.md)
- 05.11.2026: Bereich «Tennis» mit Angebote, Kunden, Flyer, Anmeldungen (F1b, Mockup «ok Mockup» 05.11. 16:40 UTC).

## Stand im Plan (roadmap.md / vorhaben.md)
- Flyer für Tennisstunden: Teil A von sieben (Bereich), danach B Flyer Deutsch 16:9, C A4/Quadrat/Englisch, D Stufen und Arten, E Anmeldeseite mit QR, F Bestätigung, G Teilnehmerliste.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. `#/me/tennis` öffnen: oben «Tennis» mit den Tabs «Angebote» und «Kunden».
2. «Kunden» antippen: die Kundenliste öffnet sich, der Tab ist markiert.
3. `#/me/offers` öffnen: dieselbe Seite wie bisher.
