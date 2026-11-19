# Test Quick Links: wartet auf die richtige «Rückgängig»-Meldung

PR folgt · 19.11.2026 · Auftrag: Koordinator (Fund beim Prüfen der Computer-Tests), Thread «UI-Test der Seite Flow»

## Was ist neu
- Nur ein Test: `tests/e2e/quicklinks.spec.js` wartet nach dem Lösen einer Pinnadel auf die Meldung «… gelöst», bevor er «Rückgängig» antippt. Vorher hat er manchmal die ältere Meldung «Pin gespeichert» erwischt; deren «Rückgängig» nimmt die Notiz zurück, darum fehlte sie nach dem Neuladen.
- Die App speichert die Notiz richtig. Es ist kein Fehler mit Daten, nur ein Test, der zu früh klickte (am Computer, weil dort das Speichern ein wenig länger dauert als die Meldung braucht).

## Was fällt weg oder rutscht tiefer
- nichts. Keine Änderung an der App.

## Selbst entschieden
- Der Test wird nicht gelockert: er prüft weiter dasselbe (Notiz, Lösen, Rückgängig, neue Gruppe, Neuladen), er wartet nur auf die richtige Meldung.
- Kein Datenformat und keine Speicherung geändert, darum keine Einzelfreigabe für Speicherung nötig; der PR braucht wie jeder andere Noahs ok.

## Prüfschritte
Nichts Sichtbares. Der Test läuft am Handy und am Computer grün.
