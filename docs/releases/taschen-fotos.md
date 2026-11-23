# Taschen-Fotos

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «P1 und p2 k1 k2 k3 u1 u2 r1 r2 r3» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»), Vorschlag K1

## Was ist neu
- Beim Packen hat jede geöffnete Tasche (Ansicht «Nach Taschen») unten «Foto dieser Tasche»: Foto machen oder aus der Galerie wählen. Es erscheint klein mit dem Datum «Gepackt am …»; ein Tipp zeigt es gross, «Anderes Foto» ersetzt es, der Mülleimer löscht es (mit Rückgängig).
- Im Rennmodus gibt es die neue Box «Was liegt wo?»: die Taschen dieses Rennens mit Foto, ein Tipp pro Tasche zeigt das Bild gross. Der Rennmodus bleibt bildlos, bis du tippst (Strom sparen).
- Die Fotos liegen in `db.photos` mit dem Feld `bagShot` (wie die Foto-Felder `wear` und `pack`), ohne Velo: sie erscheinen nie in der Velo-Galerie oder im Album. Kein neues Dexie-Schema, kein neues Backup-Format; die Fotos sind im Backup wie alle Fotos dabei.

## Was fällt weg oder rutscht tiefer
- nichts. Die Packliste, die Taschen und die Fotos der Velos bleiben, wie sie sind.

## Selbst entschieden
- «Foto dieser Tasche» steht in der geöffneten Tasche (nicht auf der Kopfzeile), damit nichts über dem Inhalt steht (Content first). «Am Körper» und «Am Velo» haben keine Tasche und kein Foto.
- Pro Tasche und Tour ein Foto; ein neues ersetzt das alte, «Rückgängig» bringt das alte zurück.
- Der Name der Tasche steht beim Foto, wie er am Packtag hiess. Benennt man die Tasche später um, bleibt der alte Name beim Foto.
- Löscht man eine Tour, bleiben ihre Taschen-Fotos in der Datenbank liegen (je etwa 150 KB); sie sind nirgends sichtbar. Aufräumen wäre eine eigene kleine Änderung.
- Der Rückblick («neben „nie gebraucht“» im Vorschlag) kommt als eigene kleine Änderung, wenn R1 steht.
- Daten: ein neuer Zeilentyp in einer bestehenden Tabelle, nichts Bestehendes wird geändert; ein Backup vor dem Merge ist trotzdem schon da (Noah 23.11. 04:47).

## Entscheide (eigene Datei `docs/decisions/taschen-fotos.md`)
- 23.11.2026: K1 freigegeben (alle neun Vorschläge, siehe `docs/decisions/garmin-kurspunkte.md`)

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Packen öffnen, eine Tour wählen, «Nach Taschen» einstellen und eine Tasche öffnen: unten «Foto dieser Tasche» tippen, ein Foto machen oder wählen. Es erscheint klein mit dem Datum.
2. Das kleine Bild tippen: es geht gross auf. «Anderes Foto» ersetzt es, der Mülleimer löscht es, «Rückgängig» bringt es zurück.
3. Den Rennmodus eines Rennens mit dieser Tour öffnen: die Box «Was liegt wo?» nennt die Tasche; ein Tipp zeigt das Foto.
