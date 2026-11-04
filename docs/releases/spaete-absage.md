# Späte Absage und No-Show

PR · 04.11.2026 · Auftrag: Noah «3a» (Thread «Planen Tennisstunden anbieten bis bezahlen»), Zusatzidee 3

## Was ist neu
- In der Karte «Stunde vorbei? Rechnung schreiben» wählst du pro Stunde «Hat stattgefunden», «Spät abgesagt» oder «Nicht erschienen».
- Rechnungsentwurf: «Spät abgesagt» zählt den halben Preis, «Nicht erschienen» den vollen. Der Grund steht im Zweck. Der Betrag bleibt im Formular änderbar.
- Die Frist («Bis N Stunden vorher absagen») war schon pro Angebot einstellbar (Ändern › Absagen bis) und steht auf der Buchungsseite.
- Die Markierung liegt nur auf dem Gerät (Einstellung «booking.outcomes», im Backup).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Halb/voll als feste Voreinstellung (Noah «3a»: «voller oder halber Preis, änderbar»); ein einstellbarer Anteil pro Angebot käme nur auf Wunsch.
- Markieren geht nach der Stunde, in der bestehenden Karte; es gibt keinen eigenen Eintrag in features.js.
- Eine Stunde, die du als «spät abgesagt» markierst, bleibt gebucht (der Platz wird nicht frei); wer vorher absagt, nutzt weiter die normale Absage.

## Entscheide (für decisions.md)
- 04.11.2026: Späte Absage = halber Preis, No-Show = voller Preis im Entwurf (Noah «3a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Zusatzideen Dienstleistung: 3 von 12 (späte Absage/No-Show).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Angebot mit vergangener Stunde öffnen, in der Karte «Nicht erschienen» wählen.
2. «Rechnung vorbereiten»: voller Betrag, Zweck nennt «nicht erschienen».
3. «Spät abgesagt» wählen: halber Betrag.
