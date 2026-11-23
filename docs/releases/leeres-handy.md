# Ein neues Gerät verbindet sich gleich am Start

PR # · 22.11.2026 · Auftrag: Noah «1b 2a 3a 4a 5a», Punkt 2a «Leeres Handy erkennen» (Thread «Sync»)

## Was ist neu
- Das Startfenster («Wie möchtest du starten?») hat eine dritte Wahl: «Ich nutze die App schon auf einem anderen Gerät». Sie schliesst das Fenster und öffnet in Ich › Daten und Backup das Feld «Code vom anderen Gerät». Es wird nichts gewählt, also kommen keine Beispiele und keine leeren Listen dazu.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die App kann nach dem Räumen des Browsers nicht wissen, dass sie vorher gekoppelt war (die Kopplung wird mit den Daten geräumt). Darum die Wahl im Startfenster, das auf jedem leeren Gerät erscheint, statt einer Warnung.
- Das Feld öffnet sich über die Adresse `#/me/data?verbinden=1`, die gleich wieder aus der Adresszeile verschwindet (wie `koppeln=`).
- Das Koppeln selbst ist unverändert (der Computer gewinnt, die Daten kommen von dort).

## Entscheide (eigene Datei `docs/decisions/leeres-handy.md`)
- 22.11.2026: Noah «1b 2a 3a 4a 5a» zu den Vorschlägen gegen ein leeres Handy (Handy war fast voll, der Browser hat die Daten geräumt)

## Stand im Plan
- Warteliste «Handy leer»: 2a gebaut. 3a, 4a und 5a folgen einzeln.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf einem Gerät mit leerem Browser (Gast-Fenster in Chrome) die App öffnen: das Startfenster zeigt drei Wahlen.
2. «Ich nutze die App schon auf einem anderen Gerät» tippen: das Feld «Code vom anderen Gerät» ist offen.
