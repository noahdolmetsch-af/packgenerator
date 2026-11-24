# Wächter nennt bei erreichter Tagesgrenze die lautesten Funktionen

PR (diese Änderung) · 24.11.2026 · Auftrag: Noah «b» (Thread «Server-Klicks»), Anlass: Wächter-Meldung #1665

## Was ist neu
- Nichts in der App. Am 23.11.2026 erreichte der Server die Gesamtgrenze von 4000 Aufrufen; bis Mitternacht sagte er «morgen wieder». Wer so viel Last machte, war nicht zu sehen: Die Wächter-Zeile «tagesgrenze» nannte nur «total».
- Neu steht in der roten Zeile auch die Zahl der Aufrufe und die vier lautesten Funktionen mit ihrer Zahl (zum Beispiel «am meisten: sync 1800, push 1500»). `dayUsage` in `api/_lib/daycap.js` liefert dafür `top`; `api/_lib/health.js` schreibt es in den Hinweis.
- Der Tageszähler von gestern lebt noch bis zum 25.11. (zwei Tage), der nächste Wächter-Lauf nach dem Deploy zeigt die Zahlen vom 23.11.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Grenze bleibt bei 4000. Noah wählte «b» (auf 8000 anheben), mit meiner Angabe «bleibt in den Gratis-Grenzen». Das stimmt nicht: Der Test «keeps every cap below the free tiers» (`tests/daycap.test.js`) rechnet 4 Upstash-Befehle pro Aufruf, 8000 × 31 × 4 wären rund 990 000 im Monat gegen 500 000 gratis. Regel «0 Kosten» geht vor, der Test wird nicht gelockert. Zuerst die Ursache sehen, dann entscheiden.
- Kein neuer Aufruf, nichts neu gezählt (derselbe `MGET` wie bisher).

## Entscheide (eigene Datei `docs/decisions/tagesgrenze-zahlen.md`)
- 24.11.2026: Tagesgrenze bleibt 4000, bis die Ursache der Last bekannt ist.

## Stand im Plan (roadmap.md / vorhaben.md)
- Server selbst warten: bei erreichter Tagesgrenze sieht Noah, welche Funktion sie füllte.
