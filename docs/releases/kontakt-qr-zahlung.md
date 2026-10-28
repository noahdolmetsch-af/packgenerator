# Zahl mir zurück

PR #(folgt) · 27.10.2026 · Auftrag: Noah «1a 2b 3a 4a 5a» (Thread «Entwerfen Kontakt-QR-Code»), Schritt 3 von 4

## Was ist neu
- Kontaktkarte, Teil «Zahlung»: «Zahlungsangaben mitgeben» (am Anfang aus). Es nimmt das Konto und die TWINT-Nummer aus Ich › Bezahlen. Ist dort nichts eingetragen, steht ein Link zum Eintragen da.
- Die Seite `#/karte/…` zeigt ein eigenes Feld «Zahlung», das zu ist. Erst «Zahlungsangaben zeigen» öffnet TWINT (Nummer zum Kopieren) und eine Schweizer QR-Rechnung ohne Betrag, die jede Banking-App liest.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- QR-Rechnung ohne Betrag und ohne Referenz: Wer zahlt, trägt den Betrag in der Banking-App ein.
- Bei «Direkt Kontakte» gehen keine Zahlungsangaben mit, weil sie sonst ungefragt im Adressbuch landen. Der Text sagt das.
- Konto und TWINT kommen aus Ich › Bezahlen, nicht aus neuen Feldern auf der Karte, damit es sie nur an einem Ort gibt.

## Entscheide (für decisions.md)
- keine neuen; umgesetzt nach «3a».

## Stand im Plan (roadmap.md / vorhaben.md)
- Kontakt-QR-Code: Schritt 3 von 4 gebaut. Danach 4 Sperrbildschirm-Bild + Sticker «Gefunden?».
