# Kopplungscode als Datei sichern

PR # · 22.11.2026 · Auftrag: Noah «1b 2a 3a 4a 5a», Punkt 4a (Thread «Sync»)

## Was ist neu
- Beim «Zweites Gerät koppeln» (Ich › Daten und Backup › Handy und Computer) gibt es neben «Code kopieren» den Knopf «Code als Datei sichern». Er speichert `pack-generator-code.txt` auf dem Computer: der Code, was man damit tut, und der Hinweis, die Datei für sich zu behalten.
- In «Ich habe einen Code» darf man den ganzen Text der Datei einfügen; die App findet den Code darin.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Eine Textdatei statt eines Bildes: Sie lässt sich öffnen, kopieren und einfügen, ohne dass etwas gescannt werden muss.
- Die Datei geht nirgends hin, sie wird nur auf dem Gerät gespeichert (wie das Backup). Der Hinweis in der Datei warnt: Wer den Code hat, kann die Daten lesen.
- Das Koppeln selbst ist unverändert; nichts wird in den Daten geändert.

## Entscheide (eigene Datei `docs/decisions/code-als-datei.md`)
- 22.11.2026: Noah «1b 2a 3a 4a 5a»

## Stand im Plan
- Warteliste «Handy leer»: 4a gebaut. 5a folgt einzeln.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup: bei «Handy und Computer» «Zweites Gerät koppeln» tippen.
2. «Code als Datei sichern» tippen: eine kleine Textdatei wird gespeichert.
3. Datei öffnen: der Code steht darin.
