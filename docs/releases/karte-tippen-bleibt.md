# Kontaktkarte: Getipptes bleibt

Anlass: Der Handy-Test «Kontakt-QR step 2» (`kontaktqr.spec.js:53`) schlug auf GitHub immer wieder einmal fehl (Neustart nötig; auch bei #1251 und #1253). Gefunden im Thread «Messen: warum die App langsam ist».

## Was ist neu
- `ContactCard.svelte` füllt die Felder einmal aus der gespeicherten Karte. Kam diese Antwort erst, nachdem schon etwas getippt war, überschrieb sie den getippten Namen mit dem gespeicherten (leeren). Der QR-Code blieb leer, und die nächste Speicherung schrieb die leere Karte.
- Jetzt bleibt ein bereits getipptes Feld, wie es getippt wurde; alle anderen Felder kommen aus der gespeicherten Karte.
- Neuer Test in `tests/e2e/kontaktqr.spec.js`: die Antworten der Einstellungen kommen 1.5 s zu spät, der getippte Name muss bleiben. Ohne die Änderung schlägt er fehl, mit ihr läuft er.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Keine neue Einstellung, kein Datenformat geändert; nur die Reihenfolge beim Füllen der Felder.
- Keine Bilder: nichts Sichtbares ändert sich, ausser dass der Name nicht mehr verschwindet.

## Stand im Plan
- Kein Plan-Punkt; ein Fund aus der Tempo-Arbeit.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Freunde › Karte öffnen und gleich den Vornamen tippen: er bleibt.
2. Seite neu laden: die Karte ist noch da.
