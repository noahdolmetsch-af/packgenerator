# Taschen packen: Foto, Etikett, Wiegen

PR #1600 · 23.11.2026 · Auftrag: Noah «P1 und p2 k1 k2 k3 u1 u2 r1 r2 r3» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»), Vorschläge K1, K2, K3 als ein PR (Bündler: Packen)

Beitrag zu den Zielen (Noah 23.11. 18:09): *Klarheit*: pro Tasche eine Hauptsache (Foto, Etikett, Waage) direkt in der geöffneten Tasche, im Rennmodus eine Box «Was liegt wo?». *Auffindbarkeit*: die Funktionen stehen in der Tasche, nicht auf einer neuen Seite; sie sind im Handbuch und in der Suche zu finden.

## Was ist neu
### K1 Taschen-Fotos
- Beim Packen hat jede geöffnete Tasche (Ansicht «Nach Taschen») unten «Foto dieser Tasche»: Foto machen oder aus der Galerie wählen. Es erscheint klein mit dem Datum «Gepackt am …»; ein Tipp zeigt es gross, «Anderes Foto» ersetzt es, der Mülleimer löscht es (mit Rückgängig).
- Im Rennmodus gibt es die neue Box «Was liegt wo?»: die Taschen dieses Rennens mit Foto, ein Tipp pro Tasche zeigt das Bild gross. Der Rennmodus bleibt bildlos, bis du tippst (Strom sparen).
- Die Fotos liegen in `db.photos` mit dem Feld `bagShot` (wie die Foto-Felder `wear` und `pack`), ohne Velo: sie erscheinen nie in der Velo-Galerie oder im Album. Kein neues Dexie-Schema, kein neues Backup-Format; die Fotos sind im Backup wie alle Fotos dabei.

### K2 Taschen-Etiketten
- In jeder geöffneten Tasche mit Teilen (Packliste, «Nach Taschen») steht «Etikett der Tasche». Es öffnet ein Bild: Name der Tasche, Tour und Datum, die Teile mit Gewicht (das schwerste zuerst, höchstens 22 Zeilen, der Rest als «+ n weitere») und unten Anzahl und Gewicht.
- «Teilen» (Handy) oder «Speichern» (Computer): das Bild gehört dir, zum Behalten auf dem Handy oder zum Drucken. Es wird auf dem Gerät gemacht, nichts wird gesendet.
- Hilft beim Einpacken im Hotelzimmer und beim Suchen unterwegs.

### K3 Taschen wiegen
- In jeder geöffneten Tasche der Packliste (Ansicht «Nach Taschen») steht «Gepackte Tasche auf der Waage (g)». Du tippst das Gewicht der gepackten Tasche, die App vergleicht mit ihrer Rechnung (Gewichte der Teile plus die Tasche selbst) und sagt: «das passt», oder «380 g mehr als die Rechnung. Fehlt ein Teil auf der Liste, oder stimmt ein Gewicht im Material nicht?» (und umgekehrt bei weniger).
- «Ändern» und «Entfernen» (mit Rückgängig). Die Zahl gehört zur Tour (`trip.weighed`), kein neues Schema, im Backup wie die Tour.
- Fehlen Teilen noch Gewichte, sagt die App ehrlich «kann noch nichts sagen» statt einen falschen Unterschied zu nennen. Ist die Tasche selbst im Material nicht gewogen, steht das dabei.

## Was fällt weg oder rutscht tiefer
- nichts. Die Packliste, die Taschen, die Gewichtsrechnung und die Fotos der Velos bleiben, wie sie sind.

## Selbst entschieden
### K1 Taschen-Fotos
- «Foto dieser Tasche» steht in der geöffneten Tasche (nicht auf der Kopfzeile), damit nichts über dem Inhalt steht (Content first). «Am Körper» und «Am Velo» haben keine Tasche und kein Foto.
- Pro Tasche und Tour ein Foto; ein neues ersetzt das alte, «Rückgängig» bringt das alte zurück.
- Der Name der Tasche steht beim Foto, wie er am Packtag hiess. Benennt man die Tasche später um, bleibt der alte Name beim Foto.
- Löscht man eine Tour, bleiben ihre Taschen-Fotos in der Datenbank liegen (je etwa 150 KB); sie sind nirgends sichtbar. Aufräumen wäre eine eigene kleine Änderung.
- Der Rückblick («neben „nie gebraucht“» im Vorschlag) kommt als eigene kleine Änderung, wenn R1 steht.
- Daten: ein neuer Zeilentyp in einer bestehenden Tabelle, nichts Bestehendes wird geändert; ein Backup vor dem Merge ist trotzdem schon da (Noah 23.11. 04:47).

### K2 Taschen-Etiketten
- Ein Bild statt einer Druckseite: es lässt sich auf dem Handy behalten und von dort drucken; eine eigene Druckansicht pro Tasche wäre eine zweite Maschine neben «Drucken / PDF».
- Die schwersten Zeilen zuerst, damit auch eine lange Tasche zeigt, worauf es ankommt. Fehlt ein Gewicht, steht «–», und die Summe trägt ein «~».
- Nur bei Taschen mit Teilen; «Am Körper» und «Am Velo» haben kein Etikett.
- Daten: keine Änderung (nichts wird gespeichert).

### K3 Taschen wiegen
- Abweichung gilt ab 30 g oder 5 % der Rechnung (was mehr ist); darunter «das passt».
- Das Feld steht in der geöffneten Tasche unter der Liste (Content first), vor dem Foto der Tasche. Nicht bei «Am Körper» und «Am Velo» und nicht bei abgeschlossenen Touren.
- Die Zahl ändert kein Gewicht im Material und keine Packliste von selbst; die App fragt nur.
- Daten: eine neue Zahl an der Tour (ein neues Feld in einer bestehenden Zeile), nichts Bestehendes ändert sich; Backup von Noah vom 23.11. 04:47 liegt bereit.

## Entscheide 
- 23.11.2026: K1, K2 und K3 freigegeben (alle neun Vorschläge, siehe `docs/decisions/garmin-kurspunkte.md`), eine Datei `docs/decisions/taschen-packen.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
### K1 Taschen-Fotos
1. Packen öffnen, eine Tour wählen, «Nach Taschen» einstellen und eine Tasche öffnen: unten «Foto dieser Tasche» tippen, ein Foto machen oder wählen. Es erscheint klein mit dem Datum.
2. Das kleine Bild tippen: es geht gross auf. «Anderes Foto» ersetzt es, der Mülleimer löscht es, «Rückgängig» bringt es zurück.
3. Den Rennmodus eines Rennens mit dieser Tour öffnen: die Box «Was liegt wo?» nennt die Tasche; ein Tipp zeigt das Foto.

### K2 Taschen-Etiketten
1. Packen öffnen, eine Tour wählen, «Nach Taschen» einstellen, eine Tasche mit Teilen öffnen und «Etikett der Tasche» tippen.
2. Ein Bild mit Tasche, Tour, Teilen mit Gewicht und der Summe erscheint.
3. «Teilen» (Handy) oder «Speichern» (Computer) tippen: das Bild wird gespeichert.

### K3 Taschen wiegen
1. Packen öffnen, eine Tour mit Taschen wählen, «Nach Taschen» einstellen, eine Tasche öffnen, unter «Gepackte Tasche auf der Waage (g)» eine Zahl tippen und «Speichern».
2. Die App nennt «das passt» oder den Unterschied mit der Frage, wo man nachschauen soll.
3. «Ändern» ändert die Zahl, «Entfernen» nimmt sie weg, «Rückgängig» bringt sie zurück.

## Entscheide 
- 23.11.2026: K1, K2 und K3 freigegeben (alle neun Vorschläge, siehe `docs/decisions/garmin-kurspunkte.md`), eine Datei `docs/decisions/taschen-packen.md`

## Entscheide 
- 23.11.2026: K1, K2 und K3 freigegeben (alle neun Vorschläge, siehe `docs/decisions/garmin-kurspunkte.md`), eine Datei `docs/decisions/taschen-packen.md`
