# Eine Nachricht am Morgen

PR #? · 27.10.2026 · Auftrag: Noah «ich möchte alle umsetzen 1a 2a 3a 4a 5a» (Thread «Brainstormen intelligentere vernetzte App», Idee A1)

## Was ist neu
- Die Erinnerungen, die die App auf 08:00 legt (Verschleiss, Kette, Vorräte, Ausgeliehenes, Einkauf vor der Tour, Rennanmeldung, Geburtstage um 08:00), kommen zusammen um 07:00 als **eine** Nachricht «Dein Morgen».
- Oben in der Nachricht: eine Tour, die an diesem Tag startet, und bis zu zwei Termine aus dem Google-Kalender (die Kopie auf dem Gerät). Höchstens 4 Zeilen, der Rest als «und N weitere in der App».
- Ich › Erinnerungen aufs Handy: neuer Abschnitt «Am Morgen» mit dem Schalter «Eine Nachricht am Morgen».

## Was fällt weg oder rutscht tiefer
- Die einzelnen Nachrichten um 08:00 fallen weg, solange der Schalter an ist (alter Weg: je eine Nachricht um 08:00 → neu: eine Nachricht um 07:00). Ausschalten bringt den alten Weg zurück.
- Warnungen bleiben einzeln: Wetter am Tourtag, Glätte, Wetter-Alarm, Licht-Alarm, Regen unterwegs, Essen unterwegs, Ozon und Pollen. Auch «Werkstatt fällig» bleibt einzeln, weil die App sie wie eine Warnung zählt (wie beim Erinnerungs-Budget).

## Selbst entschieden
- Der Schalter ist von Anfang an an (Antwort 3a «bündeln»); alle anderen Schalter bleiben wie bisher aus, bis man sie einschaltet.
- Gebündelt werden nur Erinnerungen genau um 08:00 (die Zeit, die die App selbst wählt). Eigene Zeiten (z. B. eine Notiz um 07:30) bleiben, wie man sie gesetzt hat.
- Eine Tour oder ein Termin allein schickt keine Nachricht: nur ein Tag mit mindestens einer gebündelten Erinnerung bekommt «Dein Morgen». So kommen keine neuen Nachrichten dazu.
- Liegt 07:00 heute schon zurück, kommen die Erinnerungen von heute wie bisher einzeln um 08:00.
- Das Wetter steht nicht in der Morgen-Nachricht: die Liste entsteht auf dem Handy im Voraus, die Wetter-Warnungen prüft der Server erst am Morgen selbst.
- Kein neuer Server-Teil: das Handy schickt die gebündelte Nachricht wie jede andere Erinnerung.

## Entscheide (für decisions.md)
- 27.10.2026: 13 Ideen «App denkt mit» alle umsetzen, als kleine PRs, Reihenfolge A → B → C → D (Noah «1a 2a 3a 4a 5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «App denkt mit» A1 gebaut; als Nächstes A2 (Erinnerung zur Zeit, wann du es machst).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Erinnerungen aufs Handy öffnen: unter «Am Morgen» ist «Eine Nachricht am Morgen» an.
2. Am nächsten Morgen mit einer fälligen Erinnerung (z. B. Verschleiss): um 07:00 kommt «Dein Morgen» statt einer Nachricht um 08:00.
