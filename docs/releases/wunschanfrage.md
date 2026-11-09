# Eltern nennen Wunschzeiten (Anfrageformular, Teil 1)

PR folgt · 08.11.2026 · Auftrag: Noah «1a 2a» (Thread «Landing Page für Tennis-Flyer planen»)

## Was ist neu
- Neue Buchungsart «Wunschzeit, ich antworte» im Angebot (Arten Tennis und Eigenes Angebot). Der Server (`api/booking.js`, Schritt `wish`) nimmt Orte, bis zu drei Wunschzeiten in den nächsten 14 Tagen, 1 bis 4 Kinder, Vornamen, Kontakt, Quelle (Flyer, Google, Empfehlung, Verein, Anderes) und Notiz an. Die Anfrage hält keinen Platz.
- Die Buchungsseite zeigt für solche Angebote das Formular `src/booking/Wish.svelte` statt Tagen und Zeiten.
- Auf der Angebotsseite (Ich › Tennis) steht die Karte «Wunschanfragen» mit einem Knopf pro Wunschzeit und «Ablehnen». Nach «Bestätigen» liegt die Nachricht an die Eltern bereit (wie bisher wird von Hand gesendet).
- Heute zeigt für neue Wunschanfragen eine eigene Zeile.

## Was fällt weg oder rutscht tiefer
- nichts. Angebote mit festen Zeiten («Anfrage» und «Sofort gebucht») laufen wie bisher.

## Selbst entschieden
- Eine Wunschanfrage ist eine Buchung ohne Zeit (`slot` leer, Status «requested»); «Bestätigen» speichert nur, welche Wunschzeit gilt (`pick`). Das Umwandeln in eine Stunde mit Rechnung folgt in Teil 3.
- Wunschtage ab morgen, volle Stunden 08:00 bis 20:00; höchstens 40 Anfragen pro Angebot und Tag.
- Die Eltern bekommen keinen eigenen Link zur Anfrage (sie ist keine Buchung); die Antwort kommt von Noah per Telefon oder E-Mail.
- Kein Preis im Formular: die Preise nach Kinderzahl und Ort folgen in Teil 2 (Noah «1a»: sind draussen und Halle angekreuzt, gilt der Hallenpreis, bis Noah bestätigt).
- Feste Sonntags-Slots für Tennis (Noah «2a»): Noahs Angebot wird nach dem Merge auf «Wunschzeit» umgestellt; Touren und Service behalten feste Zeiten.

## Entscheide (für decisions.md)
- 08.11.2026: Tennis-Anfragen laufen über Wunschzeiten statt feste Slots (Noah «2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Anfrageformular Tennis: Teil 1 von 3 (Teil 2 Staffelpreise, Teil 3 Antwort mit Zeit und Rechnung).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Tennis › Angebot › «Ändern» bei «So wird gebucht»: «Wunschzeit, ich antworte» wählen, speichern.
2. Buchungslink öffnen: Formular «Tennisstunde anfragen» statt Tagen und Zeiten.
3. Mit erfundenen Daten senden; im Angebot erscheint die Karte «Wunschanfragen».
4. Eine Wunschzeit bestätigen: die Nachricht an die Eltern liegt bereit.
(Server: nach dem Merge «packgen» in Vercel neu deployen.)
