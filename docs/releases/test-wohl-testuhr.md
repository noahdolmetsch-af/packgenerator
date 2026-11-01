# Test «Was mir gut tut»: auf der Test-Uhr

Auftrag: Koordinator, 1.11.2026 (Thread «Merge-Stau abbauen und Tests stabilisieren»), Punkt 2a (Wackler beheben)

## Was ist neu
- `wohl.spec.js` baute seine Antworten mit der Test-Uhr (Datum der letzten 30 Tage), öffnete die Seite aber mit der echten Uhr. Lief vorher in demselben Worker eine Datei mit Test-Uhr, standen die Daten 17 Tage neben dem Seitentag: die App sah nur 14 statt 30 Tage («Aus 14 Tagen …») und der Test scheiterte (CI Handy Teil 5, auch beim zweiten Versuch). Allein lief er grün, darum wurde es als Wackler gesehen.
- Jetzt importiert die Datei `test` aus `./clock.js`: Daten und Seite laufen auf demselben Tag. Lokal reproduziert (wasneu-design, dann wohl) und danach grün.

## Was fällt weg oder rutscht tiefer
- nichts (nur Tests, nichts in der App sichtbar)

## Selbst entschieden
- Nur diese Datei geändert. Alle anderen Dateien mit eigener Uhr bleiben, wie sie sind.

## Stand im Plan
- Merge-Stau dauerhaft lösen: Wackler beheben (Ursache: Test-Uhr und Seiten-Uhr in einem Worker nicht gleich).

## Prüfschritte
Nichts Sichtbares. CI zeigt grün.
