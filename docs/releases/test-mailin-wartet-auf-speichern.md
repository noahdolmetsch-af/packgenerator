# Test «Mail in die App» wartet auf die gespeicherte Notiz

Auftrag: Bündler, Main-Fix (rot auf main: `mailin.spec.js:22`, «Ferien Muster» nicht sichtbar).

## Was ist neu
- Nichts in der App. Nicht von «Ich aufräumen» (#1681): der Test geht direkt auf `#/me/mail`, keine Ich-Zeile im Weg.
- Ursache: Nach «Als Notiz behalten» in einem neuen eigenen Ort erscheint der Hinweis «gespeichert» einen Moment vor dem Schreiben in die Datenbank. Der Test öffnete danach sofort Notizen und fand den Ort nicht. Mit 2,5 s Wartezeit lief er grün, also ein Wettlauf im Test.
- Jetzt wartet der Test, bis die Notiz gespeichert ist (Tabelle `notes`, Stand «kept», Thema ein eigener Ort), und öffnet dann Notizen. Dieselben Prüfungen wie vorher.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Test wird nicht gelockert und bekommt keine feste Wartezeit, sondern wartet auf den Zustand, den er prüft.
- Keine Neuigkeit (`src/lib/news`), weil für Noah nichts sichtbar ist.

## Prüfschritte
1. Nichts zu prüfen in der App. `mailin.spec.js` ist lokal 3× auf Handy und Computer grün (vorher 2 von 2 rot).
