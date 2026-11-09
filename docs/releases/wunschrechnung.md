# Bestätigte Wunschstunde kommt auf die Rechnung (Anfrageformular, Teil 3)

PR folgt · 09.11.2026 · Auftrag: Noah «1a 2a» (Thread «Landing Page für Tennis-Flyer planen»)

## Was ist neu
- Eine bestätigte Wunschanfrage bekommt als Zeit die Wunschzeit, die Noah bestätigt hat (`withWishAt` in `src/lib/booking/model.js`). Damit behandelt die App sie wie eine gebuchte Stunde.
- Ist die Stunde vorbei, erscheint sie in der Karte «Stunde vorbei? Rechnung schreiben». Der Rechnungsentwurf nimmt den Preis, den die Eltern gesehen haben (Preis pro Kind mal Kinderzahl). Zu spät abgesagt zählt die Hälfte, nicht erschienen den vollen Preis, wie bei jeder Stunde.
- Mehrere Stunden gehen auf eine Rechnung, auch gemischt mit Stunden zu festen Zeiten.
- In der Liste «Bestätigt» der Wunschanfragen steht der Gesamtpreis, und ein Satz sagt, wo die Rechnung kommt.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Keine neue Stunde (kein Slot) im Angebot: Der Plan sah vor, aus der Wunschzeit einen Termin im Angebot zu machen. Das hätte den Server und das Angebot ändern müssen (api/, Einzelfreigabe). Es reicht, der bestätigten Wunschanfrage die Zeit zu geben; dieser PR ändert deshalb nichts in `api/`.
- Der Preis der Anfrage gilt für die Rechnung; ein eigener Preis eines Stammkunden (Kundenkarte) gilt nur für normale Stunden. Noah ändert den Betrag im Formular, wie immer.
- Eine bestätigte Wunschstunde steht nicht in der Liste «Gebucht» (die gehört den Plätzen eines Angebots), sondern bleibt in «Wunschanfragen › Bestätigt».
- Eine Wunschstunde ohne Preistabelle (Angebot ohne Tabelle) hat keinen Betrag im Entwurf; Noah trägt ihn ein.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Anfrageformular Tennis: Teil 3 von 3.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Tennis › dein Angebot › «Wunschanfragen»: eine Wunschzeit bestätigen. Die Liste «Bestätigt» zeigt den Gesamtpreis.
2. Nach der Stunde (frühestens am nächsten Tag): dasselbe Angebot zeigt «Stunde vorbei? Rechnung schreiben». «Rechnung vorbereiten» antippen: Betrag und Zweck sind ausgefüllt.
