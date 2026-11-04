# Regen-Absage mit Ersatzzeiten

PR · 04.11.2026 · Auftrag: Noah «1a» (Thread «Planen Tennisstunden anbieten bis bezahlen»), Zusatzidee 1

## Was ist neu
- Beim Absagen einer gebuchten Zeit nennt die vorbereitete Nachricht bis zu drei freie Ersatzzeiten desselben Angebots («Freie Zeiten: …»). Der Text ist sichtbar und wird nur von dir gesendet.
- Die abgesagte Stunde kostet nichts: sie hat nie eine Rechnung.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Ersatzzeiten sind die nächsten Zeiten mit freiem Platz, die nach der abgesagten (oder jetzt) liegen. Offene Anfragen zählen nicht als Platz.
- Kein eigener Eintrag in features.js: es ist ein Schritt der bestehenden Absage.

## Entscheide (für decisions.md)
- 04.11.2026: Regen-Absage = bestehende Absage plus Ersatzzeiten in der Nachricht (Noah «1a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Zusatzideen Dienstleistung: 1 von 12 (Regen-Absage).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Angebot mit mehreren freien Zeiten und einer gebuchten Zeit öffnen, die gebuchte Zeit antippen, «Zeit absagen».
2. Nach «Ja, absagen» steht in der Nachricht «Freie Zeiten: …».
3. «Schreiben» öffnet deine Nachrichten-App mit dem Text.
