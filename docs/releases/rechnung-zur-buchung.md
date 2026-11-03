# Rechnung zur Buchung

PR · 03.11.2026 · Auftrag: Noah «3b», «freigabe bitte fortfahren» (Thread «Planen Tennisstunden anbieten bis bezahlen»), Paket 2 von 4

## Was ist neu
- Auf Ich › Angebote › dein Angebot steht die Karte «Stunde vorbei? Rechnung schreiben»: bestätigte Buchungen, deren Zeit vorbei ist und die noch keine Rechnung haben.
- «Rechnung vorbereiten» öffnet das Rechnungsformular schon ausgefüllt: Name, E-Mail (nur wenn der Kontakt eine Adresse ist), Betrag der Art, Zweck «Angebot, Art, Datum». Gesendet wird nichts, Noah prüft und sendet wie bisher.
- Die Rechnung merkt sich ihre Buchung. In der Zeit-Ansicht steht danach «Rechnung R-0042» statt des Knopfs.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Entwurf geht über den Tab-Speicher (sessionStorage, einmal gelesen), nicht über die Adresse: kein Name in der URL.
- Betrag ist der Preis der Art pro Person. Gruppen mit mehreren Leuten bekommen je eine Rechnung (die Sammelrechnung kommt im nächsten PR).
- Keine Zeile auf Heute für fällige Rechnungen: kommt, falls Noah es will, später.

## Entscheide (für decisions.md)
- 03.11.2026: Rechnung zur Buchung als Entwurf, nie automatisch gesendet (3b).

## Stand im Plan (roadmap.md / vorhaben.md)
- Dienstleistung bis Bezahlung: Paket 2 von 4. Danach Sammelrechnung, Kundenliste.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Angebote › dein Angebot mit einer bestätigten, vergangenen Stunde: Karte «Stunde vorbei? Rechnung schreiben».
2. «Rechnung vorbereiten»: Formular ist ausgefüllt.
3. Rechnung senden, zurück zum Angebot: die Stunde zeigt die Rechnungsnummer.
