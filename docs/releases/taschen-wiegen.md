# Taschen am Starttag wiegen

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «P1 und p2 k1 k2 k3 u1 u2 r1 r2 r3» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»), Vorschlag K3

## Was ist neu
- In jeder geöffneten Tasche der Packliste (Ansicht «Nach Taschen») steht «Gepackte Tasche auf der Waage (g)». Du tippst das Gewicht der gepackten Tasche, die App vergleicht mit ihrer Rechnung (Gewichte der Teile plus die Tasche selbst) und sagt: «das passt», oder «380 g mehr als die Rechnung. Fehlt ein Teil auf der Liste, oder stimmt ein Gewicht im Material nicht?» (und umgekehrt bei weniger).
- «Ändern» und «Entfernen» (mit Rückgängig). Die Zahl gehört zur Tour (`trip.weighed`), kein neues Schema, im Backup wie die Tour.
- Fehlen Teilen noch Gewichte, sagt die App ehrlich «kann noch nichts sagen» statt einen falschen Unterschied zu nennen. Ist die Tasche selbst im Material nicht gewogen, steht das dabei.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Abweichung gilt ab 30 g oder 5 % der Rechnung (was mehr ist); darunter «das passt».
- Das Feld steht in der geöffneten Tasche unter der Liste (Content first), vor dem Foto der Tasche. Nicht bei «Am Körper» und «Am Velo» und nicht bei abgeschlossenen Touren.
- Die Zahl ändert kein Gewicht im Material und keine Packliste von selbst; die App fragt nur.
- Daten: eine neue Zahl an der Tour (ein neues Feld in einer bestehenden Zeile), nichts Bestehendes ändert sich; Backup von Noah vom 23.11. 04:47 liegt bereit.

## Entscheide (eigene Datei `docs/decisions/taschen-wiegen.md`)
- 23.11.2026: K3 freigegeben (alle neun Vorschläge, siehe `docs/decisions/garmin-kurspunkte.md`)

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Packen öffnen, eine Tour mit Taschen wählen, «Nach Taschen» einstellen, eine Tasche öffnen, unter «Gepackte Tasche auf der Waage (g)» eine Zahl tippen und «Speichern».
2. Die App nennt «das passt» oder den Unterschied mit der Frage, wo man nachschauen soll.
3. «Ändern» ändert die Zahl, «Entfernen» nimmt sie weg, «Rückgängig» bringt sie zurück.
