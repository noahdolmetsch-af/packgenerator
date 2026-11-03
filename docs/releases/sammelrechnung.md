# Sammelrechnung

PR · 03.11.2026 · Auftrag: Noah «mehrere Rechnungen zu einer kombinieren» (Thread «Planen Tennisstunden anbieten bis bezahlen»), Paket 3 von 4

## Was ist neu
- In der Karte «Stunde vorbei? Rechnung schreiben» kann man mehrere Stunden ankreuzen; «Eine Rechnung für N Stunden» öffnet das Rechnungsformular mit der Summe und allen Daten.
- Eine Rechnung kann mehrere Buchungen tragen (`bookings`). Die Stunden zeigen danach alle dieselbe Rechnungsnummer.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Beliebige Stunden dürfen zusammen, auch von verschiedenen Personen (Name dann mit Komma). Noah prüft das Formular vor dem Senden.
- Der Zweck listet die Daten; Betrag und Zweck bleiben im Formular änderbar.
- Rechnungen aus dem Paket «Rechnung zur Buchung» (eine Buchung, `booking`) werden weiter erkannt.

## Entscheide (für decisions.md)
- 03.11.2026: Sammelrechnung über Ankreuzen in der Stunde-vorbei-Karte.

## Stand im Plan (roadmap.md / vorhaben.md)
- Dienstleistung bis Bezahlung: Paket 3 von 4. Danach Kundenliste.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Angebot mit zwei bestätigten, vergangenen Stunden: beide ankreuzen.
2. «Eine Rechnung für 2 Stunden»: Formular zeigt die Summe und beide Daten.
3. Senden, zurück zum Angebot: beide Stunden zeigen die Rechnungsnummer.
