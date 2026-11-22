# Teilnehmerliste mit Warteliste und Anmeldeschluss

PR folgt · 09.11.2026 · Auftrag: Noah 05.11.2026 «5c» (Teilnehmerliste mit Anmeldeschluss, freie Plätze, Warteliste) und 09.11.2026 «ja» (Thread «Klären Flyer für Tennisstunden»)

## Was ist neu
- Neue Karte **«Teilnehmerliste»** im Angebot (unter «Gebucht»): Jede kommende Zeit mit mindestens einer Person oder einer Warteliste steht dort mit Zeit, Art, «2 von 4», freien Plätzen («2 Plätze frei» oder «voll»), den Namen in einer nummerierten Liste und der Warteliste. Offene Anfragen werden nur gezählt. Ein Tipp auf eine Zeile öffnet die Zeit (Nachricht an alle, Bestätigung, Warteliste, Absage).
- **Anmeldeschluss**: ein Datum pro Angebot, das du auf der Karte schreibst. Die Karte zählt die Tage («noch 3 Tage», «Heute ist der letzte Tag», «Vorbei seit 2 Tagen», dann in Warnfarbe). Der Schluss ist deine Notiz: Die Buchungsseite schliesst **nicht** von selbst (das braucht den Server, siehe unten).
- **«Liste kopieren»**: Die Liste als Text mit Titel, Anmeldeschluss, Zeiten, Namen und Warteliste. Nur Namen, keine Telefonnummern oder Adressen, damit sie auch an eine Halle oder einen zweiten Trainer gehen kann.
- Ohne Teilnehmende sagt die Karte, warum sie leer ist, und bietet «Link kopieren» an.
- Der Anmeldeschluss steht im Backup (Einstellung `booking.deadlines`, kein `api/`-Change). Namen kommen vom Server, solange die Seite offen ist, und werden nicht auf dem Gerät gespeichert. Die App sendet nichts.

## Was fällt weg oder rutscht tiefer
- nichts. Die Karte «Gebucht», die Zeit-Ansicht mit Warteliste und «Eine E-Mail an alle» bleiben wie sie waren.

## Selbst entschieden
- Der Anmeldeschluss ist nur eine Notiz auf dem Gerät. Eine echte Sperre der Buchungsseite braucht `api/` (Einzelfreigabe) und würde nach dem Datum keine neue Buchung mehr annehmen. Frage an Noah: a) so lassen, b) Sperre als eigener PR (★ b, wenn Eltern sich sonst nach dem Schluss noch anmelden können).
- Nur Zeiten mit Personen oder Warteliste stehen in der Liste; leere Zeiten gäbe es sonst ohne Ende (acht Wochen pro Wiederholung).
- Ein Anmeldeschluss pro Angebot, nicht pro Zeit (ein Ferienkurs oder eine Gruppenstunde hat einen Schluss); pro Zeit bleibt später möglich.
- Kopierter Text nur mit Namen (Datenschutz).
- Fertig-Regel: wie bei Erinnerung und Bestätigung keine eigene Funktion im Katalog und keine Karte «Gut zu wissen» (Teil der Seite «Tennis › Angebote»); Absprung ist die Zeile «Gebucht» und «Link kopieren» im Leerzustand; die Zeile in `docs/app-stand.md` wurde ergänzt.
- Wörter «noch {n} Tage» und «Anmelden bis» stammen aus bestehenden Texten (`neuland.js`, `paketn.js`), damit es keine zwei Übersetzungen gibt.

## Entscheide (für decisions.md)
- keine neuen (Noah «5c» vom 05.11.2026 gilt)

## Stand im Plan (roadmap.md / vorhaben.md)
- Zusatzideen Dienstleistung: Teilnehmerliste mit Warteliste ist online (Warteliste selbst seit #906/Warteliste-PR); offen bleiben die echte Sperre nach Anmeldeschluss (`api/`) und der echte Versand mit Mail-Dienst.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Tennis › Angebote › ein Angebot mit gebuchter Zeit öffnen: Die Karte «Teilnehmerliste» zeigt Zeit, Namen, «n von m» und freie Plätze.
2. Bei «Anmeldeschluss» ein Datum wählen: «noch … Tage» oder «Vorbei seit …» steht darunter; nach dem Neuladen bleibt es.
3. Auf «Liste kopieren» tippen und irgendwo einfügen: Nur Namen und Warteliste, keine Nummern.
