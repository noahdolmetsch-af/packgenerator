# Preis nach Kinderzahl und Ort (Anfrageformular, Teil 2)

PR folgt · 08.11.2026 · Auftrag: Noah «1a 2a» (Thread «Landing Page für Tennis-Flyer planen»), Preise: Noah 07.11.2026 «plus»

## Was ist neu
- Ein Wunsch-Angebot hat eine Preistabelle: Preis pro Kind für 1 bis 4 Kinder, draussen und in der Halle, Platz inklusive. Vorschlag (Noah 07.11.): draussen 100 / 70 / 60 / 55, Halle 140 / 90 / 75 / 65. Jede Zahl ist änderbar (Ich › Tennis › Angebot › «Ändern» bei «So wird gebucht»).
- Noah markiert dort, welcher seiner Orte eine Halle ist.
- Das Formular für die Eltern zeigt den Preis sofort: pro Kind und insgesamt für eine Stunde. Ist unter den angekreuzten Orten eine Halle, gilt der Hallenpreis, bis Noah bestätigt (Noah «1a»).
- Der Server rechnet den Preis aus der Tabelle (`wishPrice` in `api/_lib/booking.js`); eine Zahl aus dem Formular zählt nie. Die Anfrage speichert ihn.
- In der Karte «Wunschanfragen» steht der Preis bei jeder Anfrage, und die vorbereitete Nachricht an die Eltern nennt «Preis: CHF … pro Kind».

## Was fällt weg oder rutscht tiefer
- nichts. Angebote ohne Wunsch-Modus haben keine Preistabelle und laufen wie bisher.

## Selbst entschieden
- Die Tabelle gilt nur im Modus «Wunschzeit»; die Preise der Arten (Einzel, Gruppe) bleiben für feste Zeiten.
- Preise als ganze Rappen von 0 bis 10 000 CHF; eine unvollständige Tabelle wird nicht gespeichert.
- Der Rechnungsentwurf übernimmt den Preis in Teil 3, sobald aus der bestätigten Wunschzeit eine Stunde mit Zeit wird (vorher gibt es keine Stunde, an der eine Rechnung hängt).
- Schnupperstunde zum halben Preis bleibt vorbereitet und wird nicht angezeigt.

## Entscheide (für decisions.md)
- 08.11.2026: Hallenpreis, sobald ein Hallen-Ort angekreuzt ist, bis Noah bestätigt (Noah «1a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Anfrageformular Tennis: Teil 2 von 3.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Tennis › Angebot › «Ändern»: «Wunschzeit, ich antworte» wählen; die Tabelle «Preis pro Kind» erscheint. Hallen-Ort ankreuzen, speichern.
2. Buchungslink öffnen, einen Ort ankreuzen, Zahl der Kinder ändern: der Preis ändert sich.
3. Hallen-Ort dazu ankreuzen: Hallenpreis.
4. Testanfrage senden: Karte «Wunschanfragen» zeigt den Preis.
(Server: nach dem Merge deployt «packgen» von selbst; auf READY achten.)
