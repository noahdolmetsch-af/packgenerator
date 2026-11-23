# Dunkel-Kontrast-Prüfung: Chip-Zahl auf Neuigkeiten statt Material

23.11.2026 · Auftrag: Bündler «dunkel-kontrast.spec:25 rot auf main» (Thread «Velos und Material aufräumen»)

Kein sichtbarer Unterschied in der App, darum keine News-Datei (Patch-Nummer).

## Was ist neu
- nichts in der App. Eine Prüfung ist wieder grün.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- `tests/e2e/dunkel-kontrast.spec.js` prüfte im dunklen Thema die Zahl im gewählten Chip «Springen zu» auf Material am Handy. Seit
  «Material aufräumen» (#1525) hat Material diese Chips am Handy nicht mehr (die Liste steht direkt unter der Suche). Die Absicht
  der Prüfung bleibt: dieselben Chips (`.ls-c`) stehen auf Neuigkeiten, dort wird die Zahl jetzt gelesen, Grenze unverändert (3 : 1).
  Nichts gelockert; die Kochen- und Kleider-Prüfungen in der Datei sind unverändert.
- Keine Datenänderung.

## Entscheide
- Keine neue.

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Dunkles Thema einschalten, «Neuigkeiten» öffnen: die Zahl im gewählten Chip oben ist gut lesbar.
