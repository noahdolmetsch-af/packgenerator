# Velos: Prüfungen repariert, Stern und Rundgang zurück

PR #1520 · 23.11.2026 · Auftrag: Bündler «Main ist rot wegen 1508» (Thread «Velos und Material aufräumen»)

## Was ist neu
- Der **Stern des Standard-Velos** steht wieder: auf der Karte des ersten Velos (vorher am Reiter, den es seit «Velos aufräumen» nicht mehr gibt).
- **Rundgang durch Velos** startet aus dem «?»-Fenster und schliesst es, damit die Rundgang-Karte nicht darunter liegt.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Stern hing am Reiter der zweiten Reihe, die weg ist; er gehört zum Standard-Velo und steht darum auf der Karte (nichts geht verloren).
- Der Rundgang-Knopf liegt seit «Velos aufräumen» im «?»-Fenster (wie bei Aktiv); er schloss das Fenster nicht. Jetzt schliesst er es.
- Geänderte Prüfungen (mit Absicht, nichts gelockert): `rundgang.spec.js` (Einstieg im «?»-Fenster), `sn-c.spec.js` und `standard-velo.spec.js` («Velo hinzufügen» ist die gestrichelte Karte, die Velos stehen als Karten), `sn-c.spec.js` (Taschen aus dem Import lesen sich deutsch).
- Keine Datenänderung.

## Entscheide
- Keine neue (siehe `docs/decisions/velos-aufraeumen.md`).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Velos und Material aufräumen»: PR 1 online, dieser PR repariert seine Prüfungen; PR 2 «Material aufräumen» folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Velos und Material» öffnen: die erste Velokarte hat einen Stern.
2. «?» tippen, «Starten ›» beim Rundgang: das Fenster schliesst sich, der Rundgang beginnt.
