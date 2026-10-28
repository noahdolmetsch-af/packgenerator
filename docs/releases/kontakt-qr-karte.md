# Scan mich

PR #292 · 27.10.2026 · Auftrag: Noah «1a 2b 3a 4a 5a» (Thread «Entwerfen Kontakt-QR-Code», Entwurf https://claude.ai/artifact/54AdarKSkTYZrVh4BfQb1R)

## Was ist neu
- Die Kontaktkarte unter Ich › Mit Freunden trägt neu WhatsApp, E-Mail, Strava, Komoot, Webseite und Adresse, jede Angabe mit «Auf der Karte». Unter dem QR-Code steht, was auf der Karte ist.
- Die Seite, die der QR-Code öffnet (`#/karte/…`), zeigt eine Zeile pro Weg (Anrufen, WhatsApp, E-Mail, Instagram, Strava, Komoot, Webseite, Adresse auf OpenStreetMap) und «In Kontakte speichern» (vCard 3.0, auf dem Gerät gemacht).

## Was fällt weg oder rutscht tiefer
- nichts. Ältere Karten-Links funktionieren weiter (Link-Version bleibt 1, `CARD_FIELDS` in `src/lib/live/event.js`).

## Selbst entschieden
- Die bestehende Kontaktkarte ausgebaut statt eine neue Seite gemacht.
- Adresse, Telefon und WhatsApp starten aus (`SHOW_DEFAULT` in `src/lib/freunde/people.js`); der Rest zeigt sich, sobald er ausgefüllt ist.
- Strava nur als Link oder Profilnummer (Strava hat keine Namen-Links); die Adresse öffnet OpenStreetMap.
- Nur sichere Links (tel, mailto, https) kommen auf die Seite.
- Kontaktdatei als vCard 3.0, weil iPhone und Android sie beide lesen.
- Kein Server, kein neues Schema.

## Entscheide (für decisions.md)
- 27.10.2026: Noah «1a 2b 3a 4a 5a» zum Kontakt-QR-Code: 1a QR öffnet eine Seite mit Knöpfen, «direkt Kontakte» (vCard) wählbar; 2b keine Profile, eine Karte, vor dem Zeigen ankreuzen; 3a «Zahlung» separat mit Swiss QR Code und TWINT, erst nach Tippen sichtbar; 4a weiches Ablaufdatum ohne Server; 5a Sperrbildschirm-Bild und Sticker «Gefunden?» gleich einplanen, Gruppenfahrt und Tour danach.

## Stand im Plan (roadmap.md / vorhaben.md)
- Kontakt-QR-Code: Schritt 1 von 4 gebaut. Danach 2 Ablaufdatum + Gross zeigen + Direkt Kontakte, 3 Zahlung (Swiss QR + TWINT), 4 Sperrbildschirm-Bild + Sticker «Gefunden?»; danach Gruppenfahrt und Tour als QR.
