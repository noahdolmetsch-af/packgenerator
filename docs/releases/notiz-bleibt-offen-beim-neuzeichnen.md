# Notiz-Fenster bleibt offen, wenn die Seite neu gezeichnet wird

PR #NNNN · 27.11.2026 · Auftrag: Wackler im Test «every function is visible on its home page» (Notiz-Fenster, f.richtext), rot auf PR 1826 und 1827, Meldung des Bündlers

## Was ist neu
- Nichts Sichtbares geändert, nur ein Fehler im Hintergrund behoben: Öffnet ein Link eine Notiz (`#/notes?open=…`, zum Beispiel zurück vom Scan in eine Notiz oder aus der Suche), blieb das Notiz-Fenster manchmal zu.
- **Ursache:** Die Seite Notizen löscht `?open=` aus der Adresse, sobald sie startet. Zeichnet die App die Seite danach neu (das tut sie, wenn die geänderten Listen des Nutzers nach dem Start eintreffen, oder wenn eine andere Tour gewählt wird), liest die neue Zeichnung die Adresse ohne `?open=` und öffnet nichts. Nur wer geänderte Listen hat (der Test-Datensatz und Noah), und nur wenn die Listen erst nach der Seite ankommen. Darum rot 1 von 6 unter Last, auf einem ruhigen Rechner fast nie.
- **Fix:** Die Seite merkt sich die offene Notiz ausserhalb der Zeichnung (`carry` in `src/pages/Notes.svelte`); die neue Zeichnung öffnet sie wieder. Schliesst der Nutzer die Notiz oder verlässt er die Seite, wird nichts gemerkt, die Notiz geht also nicht später von selbst auf.
- **Test:** `tests/e2e/notiz-offen-neu-zeichnen.spec.js` löst das Neuzeichnen von Hand aus (Ereignis `pg:switchtrip`) und prüft, dass das Fenster danach wieder offen ist und nach dem Schliessen zu bleibt. Vorher rot (Handy und Computer), jetzt grün.
- `heimat.spec.js`: die Meldung «its window did not open» wird jetzt direkt nach dem Warten gemessen (vorher nach dem Escape, dann stimmte sie nicht mehr).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- App-Fix statt längerem Warten im Test: das Fenster ging wirklich verloren, auch nach 15 Sekunden Warten.
- Die Adresse wird weiter beim Start bereinigt (wie bisher), damit Neuladen und «Zurück» sich nicht ändern.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Notiz öffnen (Notizen, auf die Notiz tippen): das Fenster geht auf, «Fertig» schliesst es. Sonst ist nichts zu sehen.
