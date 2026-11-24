# Rückblick und Gelerntes auf Heute

Auftrag: Noah «3a 4a 5a» (Thread «Versteckte Inhalte auffindbar machen», Aufgabe «Häufiges nach vorn»); 3a und 4a in einem PR, weil beide nur die Zeile «Heute entdecken» betreffen.

## Was ist neu
- **Rückblick zur letzten Tour (3a):** Wer von einer Tour zurück ist und ihren Rückblick noch nicht gemacht hat (der Moment «Zurück», bis 14 Tage nach der Tour), bekommt in der Zeile «Heute entdecken» die Idee «Rückblick zur letzten Tour» mit dem Namen der Tour und dem «Warum». «Öffnen» geht direkt zum Rückblick der Tour. Sie steht gleich nach einem fast erreichten Stern.
- **Neu gelernt (4a):** «Neu gelernt aus deinen Rückblicken» nennt die neueste Erkenntnis der letzten drei Wochen (Tabelle `learnings`, ohne archivierte) und führt zu «Gelernt» (`#/gelernt`). Sie steht nach den Tourenvorschlägen und vor den Neuigkeiten, in der Zeile oder in «Mehr Ideen».
- Beide haben wie jede Idee «Später» und «Nicht für mich» mit Rückgängig. «Nicht für mich» gilt für diese eine Tour bzw. diese eine Erkenntnis, nicht für die ganze Art.

## Was fällt weg oder rutscht tiefer
- nichts. Der Rückblick steht weiter in «Jetzt dran», in Touren › Rückblick und auf der Tour; «Gelernt» liegt weiter unter Auswerten › Fahrten. Es kommt nur ein zusätzlicher Absprung dazu.

## Selbst entschieden
- Der Rückblick-Hinweis nutzt den bestehenden Moment «Zurück» (Regel 2 in `moment.js`), keine eigene Zählung: gleiche Regel wie überall.
- «Gelernt» nutzt nur die Regel und das Datum der Erkenntnis; keine neue Berechnung. Heute lädt dafür die kleine Tabelle `learnings` beim Leerlauf (zusammen mit den anderen Daten der Zeile).
- 5a (Wiegen im Neu-Menü und in der Packliste) ist ein eigener PR: er berührt das Neu-Menü (wird im Auftrag «App aus Nutzersicht» umgebaut) und die Packliste (Packen-Thread), darum erst nach Abstimmung dort.
- Keine Datenänderung: kein Dexie-Schema, kein Backup-Format, kein `api/`, kein Sync.

## Entscheide
- Noah «3a 4a 5a» (23.11.2026): `docs/decisions/heute-entdecken-mehr.md`

## Stand im Plan
- Häufiges nach vorn: Rückblick (3a) und Gelerntes (4a) gebaut; Wiegen (5a) folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen, wenn eine Tour vorbei ist und ihr Rückblick fehlt: unter den Chips steht «Rückblick zur letzten Tour» mit dem Namen der Tour.
2. «Mehr Ideen» antippen: «Neu gelernt aus deinen Rückblicken», wenn in den letzten Wochen eine Erkenntnis dazukam.
3. «Später» antippen: die Idee ist bis morgen weg, «Rückgängig» holt sie zurück.
