# Dein Velo hat Geburtstag

PR folgt · 03.11.2026 · Auftrag: Noah «b» (alle 5 Ideen von «Paket C: Das Velo lebt»; Thread «Durchgehen: offene Fragen einzeln»), Idee 21

## Was ist neu
- Heute, Bereich Velos: Am Jahrestag des Kaufdatums eines Velos steht dort «Dein Gravel wird heute 2. Ihr seid 6’428 km zusammen gefahren.»
- «Ausblenden» blendet den Gruss für dieses Jahr aus (gemerkt auf dem Gerät).

## Was fällt weg oder rutscht tiefer
- nichts. Am Geburtstag steht eine Zeile über den Velo-Kacheln; an allen anderen Tagen ändert sich nichts.

## Selbst entschieden
- Das Kaufdatum ist das bestehende Feld «Kaufdatum» im Velo-Blatt «Garantie & Belege» (kein neues Feld). Ohne Datum gibt es keinen Gruss.
- «Zusammen gefahren» sind die gespeicherten Gesamt-km des Velos (`bike.km`); ohne km nur der erste Satz.
- Kaufdatum heute oder in der Zukunft: kein Gruss (erst ab 1 Jahr). Ein 29. Februar feiert in Jahren ohne Schaltag am 28. Februar.
- Der Gruss steht im Bereich Velos von Heute; ist dieser Bereich auf Heute ausgeblendet, erscheint er nicht.
- Ohne Bewegung (ruhige Zeile); keine neue Funktion im Sinn der Fertig-Regel, daher kein `features.js`-Eintrag.
- `docs/app-stand.md` liegt noch nicht in `main`; die Zeile kommt dazu, sobald die Datei da ist.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Neuer Schwung» / Velo-Momente: Idee 21 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos › ein Velo › Garantie & Belege: Kaufdatum auf den heutigen Tag vor zwei Jahren setzen.
2. Heute öffnen: im Bereich Velos steht «… wird heute 2» mit den km.
3. «Ausblenden» tippen: der Gruss ist weg und bleibt nach dem Neuladen weg.
