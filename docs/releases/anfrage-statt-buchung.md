# Anfrage statt Sofortbuchung

PR · 03.11.2026 · Auftrag: Noah «1b 2b 3b 4b 5a» (Thread «Planen Tennisstunden anbieten bis bezahlen»), Paket 1 von 4

## Was ist neu
- Jedes Angebot hat einen Modus: «Anfrage, ich antworte» (Tennis startet so) oder «Sofort gebucht» (wie bisher; Tour, Velo-Service, eigenes). Änderbar unter So wird gebucht › Ändern.
- Mehrere Orte pro Angebot (bis 4). Jede freie Zeit gehört zu einem Ort; wer bucht, wählt Ort und Zeit.
- Bemerkung (freiwillig, bis 300 Zeichen) bei der Anfrage. Der Preis steht auf der Anfrage und der Bestätigungsseite.
- Eine Anfrage hält keinen Platz. Erst «Bestätigen» nimmt den Platz; «Ablehnen» lässt ihn frei. Die App bereitet die Nachricht an die Person vor (SMS, Mail oder WhatsApp), Noah sendet sie selbst.
- Die Person sieht auf ihrer Seite: «Anfrage gesendet, Antwort bis …», danach «Gebucht» oder «Leider nicht möglich».
- Heute zeigt «Neue Anfrage: …» (gleiche Zeile wie neue Buchungen).

## Was fällt weg oder rutscht tiefer
- Tennis-Angebote werden nicht mehr sofort gebucht, sondern angefragt. Alter Weg zurück: So wird gebucht › Ändern › «Sofort gebucht». Bestehende Angebote bleiben «Sofort gebucht».

## Selbst entschieden
- Antwortfrist 24 h wird angezeigt, aber nicht erzwungen und es gibt keine automatische Absage.
- Bei Anfragen wird nicht online bezahlt: «bezahlen nach der Stunde». Die Rechnung kommt im nächsten PR.
- Eine Anfrage für eine volle Zeit wird abgelehnt (slot_full), sonst nicht begrenzt (bis 500 Buchungen pro Angebot wie bisher).
- Orte sind freier Text, nicht eine Liste in «Listen und Typen».
- Neue Wörter für die Fertig-Regel: kein neues Feature, die Funktion erweitert «Angebote»; Seite, Absprung, Wissenstext und Leerzustand existieren dafür schon.

## Entscheide (für decisions.md)
- 03.11.2026: Anfrage oder sofort wählbar pro Angebot (1b); mehrere Orte pro Angebot (2b).

## Stand im Plan (roadmap.md / vorhaben.md)
- Dienstleistung bis Bezahlung: Paket 1 von 4 (Anfrage). Danach Rechnung zur Buchung, Sammelrechnung, Kundenliste.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Angebote › Tennis-Lektion starten: unter «So wird gebucht» steht «Anfrage, du antwortest innert 24 h».
2. Öffne den Link des Angebots: Ort und Zeit wählen, Bemerkung schreiben, «Anfrage senden»: «Noch nicht gebucht».
3. In der App auf die Zeit tippen: «Bestätigen» zeigt die vorbereitete Nachricht.
