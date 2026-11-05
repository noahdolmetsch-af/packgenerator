# Stundenkarte (10er-Karte)

PR · 04.11.2026 · Auftrag: Noah «5a» (Thread «Planen Tennisstunden anbieten bis bezahlen»), Zusatzidee 5

## Was ist neu
- In der Kundenliste hat jeder Kunde optional eine Stundenkarte: Anzahl Stunden, Preis der ganzen Karte, Starttag.
- «Rechnung für die Karte vorbereiten» öffnet das Rechnungsformular mit Name, Preis und «10er-Karte».
- Die Liste zeigt «Karte: 3 von 10 benutzt».
- Im Angebot steht bei Stunden auf der Karte «Auf der Karte: Stunde 3 von 10»; die Rechnung dazu bleibt möglich, ist aber nicht mehr hervorgehoben.
- Karte ändern oder löschen: Zahl leer lassen. Alles nur auf dem Gerät (Kundenliste, im Backup).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Gezählt werden die Stunden desselben Angebots auf diesem Gerät, die ab dem Starttag stattfanden (nach Zeit sortiert, die ersten N).
- Abos (Noah «5b») folgen als eigener PR.
- Kein eigener Eintrag in features.js: die Karte gehört zur Kundenliste.

## Entscheide (für decisions.md)
- 04.11.2026: Stundenkarte pro Kunde mit Anzahl, Preis und Starttag (Noah «5a»).

## Stand im Plan
- Zusatzideen Dienstleistung: 5 von 12 (Karte; Abos folgen).

## Prüfschritte (nach dem Merge)
1. Kunden öffnen, 10 Stunden und Preis eintragen, speichern: «Karte: 0 von 10 benutzt».
2. «Rechnung für die Karte vorbereiten»: Formular mit Name, Preis, «10er-Karte».
