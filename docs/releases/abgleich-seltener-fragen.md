# Abgleich fragt in ruhigen Zeiten seltener nach

PR (diese Änderung) · 24.11.2026 · Auftrag: Noah «ja» (Thread «Server-Klicks», Frage «Sollen die Geräte seltener nachfragen?»), Anlass: Wächter-Meldung #1665

## Was ist neu
- Am 23.11.2026 erreichte der Server die Tagesgrenze von 4000 Aufrufen; bis Mitternacht stand der Abgleich still. Der Wächter (PR 1676) zeigte die Ursache: 2437 Abgleich-Aufrufe von 4594 (Weckruf 1440, Rest klein). Jede Nachfrage «gibt es etwas Neues?» ist ein Aufruf; ein Computer, der offen vorne steht, fragte im ruhigen Takt 1440 Mal am Tag.
- Neu fragt ein offenes Gerät nach 30 ruhigen Runden (zehn zu 20 Sekunden, zwanzig zu 60 Sekunden, rund 23 Minuten ohne Neues) nur noch alle 3 Minuten (`DEEP_MS`, `DEEP_AFTER` in `src/lib/sync/auto.svelte.js`). Ein Gerät, das den ganzen Tag ruhig offen steht, braucht so rund 480 statt 1440 Aufrufe am Tag.
- Ein Tipp oder ein Tastendruck nach der ruhigen Zeit fragt sofort nach und bringt den schnellen Takt zurück (20 Sekunden). Wer am Gerät arbeitet, merkt also nichts. Beim Zurückkommen in die App, nach einer Änderung auf dem Gerät und bei zurückgekehrtem Netz galt das schon vorher.
- Die Gesundheitsanzeige (grün bis 10 Minuten, `LATE_MS`) bleibt grün: 3 Minuten liegen darunter.

## Was fällt weg oder rutscht tiefer
- Eine Änderung vom anderen Gerät kann auf einem seit über 23 Minuten unberührt offenen Gerät bis zu 3 Minuten später ankommen (vorher bis zu 1 Minute). Wer das Gerät berührt, bekommt sie sofort.

## Selbst entschieden
- Keine neue «Was ist neu»-Datei: Für Noah ist nichts sichtbar (Regel «ein PR ohne sichtbare Änderung legt keine an»).
- Die Gesamtgrenze bleibt 4000 (8000 würde die Gratis-Grenze von Upstash sprengen, `tests/daycap.test.js`). Der Weckruf zählt weiter mit.
- Keine Daten-, Backup- oder Serveränderung: nur der Takt im Browser. Das frische Backup vom 24.11. liegt trotzdem bereit (Regel R17).

## Entscheide (eigene Datei `docs/decisions/abgleich-seltener-fragen.md`)
- 24.11.2026: Abgleich fragt nach langer Ruhe nur alle 3 Minuten; ein Tipp holt den schnellen Takt zurück (Noah «ja»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Server selbst warten: die Tagesgrenze wird in ruhigen Tagen nicht mehr durch den Abgleich gefüllt.
