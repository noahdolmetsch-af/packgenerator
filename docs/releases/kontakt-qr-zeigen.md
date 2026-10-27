# Gross und mit Ablauf

PR #313 · 27.10.2026 · Auftrag: Noah «1a 2b 3a 4a 5a» (Thread «Entwerfen Kontakt-QR-Code»), Schritt 2 von 4

## Was ist neu
- Kontaktkarte: «Wie lange die Karte gilt»: nur heute, 1 Woche (Start), 1 Monat oder immer. Der Tag steckt im Link (`until`); die Seite `#/karte/…` zeigt «Geteilt bis …» und nach dem letzten Tag «Diese Karte ist abgelaufen» ohne Angaben.
- «Was der QR-Code öffnet»: «Seite mit Knöpfen» (Start) oder «Direkt Kontakte» (der Code enthält die vCard; ohne Internet, ohne Ablaufdatum).
- «Gross zeigen»: der Code allein auf hellem Bildschirm; der Bildschirm bleibt an, solange er offen ist (Wake Lock, wenn das Handy es erlaubt).
- QR-Codes der App schreiben Umlaute jetzt als UTF-8 (wie die QR-Rechnung), damit Kameras «ü» richtig lesen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Start mit «1 Woche», wie im Entwurf K1. Gezählt in Kalendertagen, der heutige Tag zählt mit (1 Woche ab Dienstag = bis Montag).
- Bei «Direkt Kontakte» verschwindet die Wahl des Ablaufs, weil ein Kontakt im Adressbuch nicht abläuft; der Text sagt das.
- Weiches Ablaufdatum (Noah «4a»): Der Text unter der Wahl sagt ehrlich, dass die Angaben im Link lesbar bleiben.

## Entscheide (für decisions.md)
- keine neuen; umgesetzt nach «1a 4a».

## Stand im Plan (roadmap.md / vorhaben.md)
- Kontakt-QR-Code: Schritt 2 von 4 gebaut. Danach 3 Zahlung (Swiss QR + TWINT), 4 Sperrbildschirm-Bild + Sticker «Gefunden?».
