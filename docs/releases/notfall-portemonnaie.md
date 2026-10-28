# Notfall-Karte fürs Portemonnaie

PR (diese Änderung) · 28.10.2026 · Auftrag: Noah «a) bauen» (Thread «16 neue Ideen einzeln entscheiden», Idee 1158)

## Was ist neu
- Berg und Notfall › Notfall-QR: neuer Knopf «Portemonnaie-Karte drucken» unter dem Code. Der Browser druckt nur eine Karte in Kreditkartengrösse (85,6 × 54 mm, gestrichelter Rand zum Ausschneiden) mit den ausgefüllten Angaben (höchstens 8 Zeilen) und dem QR-Code.
- Hilft, wenn das Handy leer oder kaputt ist. Alles bleibt auf dem Gerät; gedruckt wird über das normale Druckfenster (auch «Als PDF speichern»).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Schwarz auf Weiss, damit es auf jedem Drucker lesbar ist; der Code steht rechts, 24 mm gross.
- Höchstens 8 Zeilen auf der Karte; der Code enthält immer alle Angaben.
- Nur am Knopf sichtbar, kein neuer Eintrag in «Was kann die App» (Teil von «Notfall-QR»).
- Die Druckgrössen und Druckfarben stehen als eigene Werte in `src/app.css` (`--fs-print`, `--print-ink`), damit der Stil-Wächter streng bleibt.

## Entscheide (für decisions.md)
- 28.10.2026: Notfall-Karte zum Ausdrucken fürs Portemonnaie bauen (Noah «a) bauen», Idee 1158).

## Stand im Plan (roadmap.md / vorhaben.md)
- Berg und Notfall: Notfall-Karte auch auf Papier.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Berg und Notfall › Notfall-QR, fülle mindestens den Notfallkontakt aus und tippe «Karte speichern».
2. Tippe «Portemonnaie-Karte drucken»: Im Druckfenster steht nur eine kleine Karte mit den Angaben und dem Code.
3. Drucke sie (oder speichere als PDF), schneide sie am gestrichelten Rand aus.
