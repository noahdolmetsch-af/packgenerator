# In Zahlen: die Monats-Diagramme zum Antippen

PR 15 · 09.11.2026 · Auftrag: Noah «ja» (Thread «Diagramme antippbar und genau machen»), Rückblick, `InZahlen`

## Was ist neu
- Die Balken in «In Zahlen» (Touren und Vergangene Touren) sind Diagramme nach den Regeln der App, neu `src/lib/review/MonthBars.svelte` auf `BarChart`: Achse ab 0 mit Einheit, Zahl auf den Balken (bei vielen Monaten nur auf dem neuesten und dem höchsten), Zeigen nennt die genauen Werte, Tippen öffnet ein Fenster mit «Der davor» / «Der danach», «Als Tabelle» listet die Monate, neuester zuerst.
- Das gilt für: «km und Höhenmeter» (zwei Diagramme), «Wochentag und Startzeit» (Touren pro Wochentag), die Zeit in Herzfrequenz-Zonen pro Monat (Zonen in Farbe, Z1 bis Z5, Summe und je Zone im Fenster), «Tempo über die Monate» und «Puls und Leistung pro Monat» (je ein Diagramm für Ø und höchsten Puls, Ø und höchste Leistung).
- Der Wächter `charts-rules` zählt `MonthBars.svelte` zu den fertigen Diagrammen; `InZahlen.svelte` steht nicht mehr bei den offenen.

## Was fällt weg oder rutscht tiefer
- Die Zeile «Ø Herzfrequenz» unter den Tempo-Balken steht jetzt beim Zeigen, im Fenster und in der Tabelle des Tempo-Diagramms.
- Die kleinen Zeilen-Balken in «Puls und Leistung pro Monat» (28 px hoch, daneben der letzte Wert) sind jetzt je ein ganzes Diagramm; der letzte Wert steht als Zahl auf dem neuesten Balken und in der Zeigen-Zeile.
- Ein Monat ohne Zonenzeit hat keinen kurzen grauen Stumpf mehr.

## Selbst entschieden
- Bis 12 Monate trägt jeder Monat seinen Buchstaben, darüber jeder dritte Monat seinen Kurznamen.
- Die Zonen-Stunden stehen als «h:mm h»; die Achse läuft in Stunden.
- Die Balken «Anteil am Tag» (Vormittag, Nachmittag, Abend) bleiben Anteile, kein Diagramm.
- Ein Schritt pro PR; Unterwegs, Rennen, Ski, Aktiv-Reste folgen einzeln.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 15 (Rückblick, In Zahlen). Danach Unterwegs, Rennen, Ski, Aktiv-Reste.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › In Zahlen › «Strecke»: auf einen Balken von «km und Höhenmeter» zeigen, Monat und Wert stehen darüber.
2. Einen Balken antippen: Fenster mit den Zahlen, «Der davor» / «Der danach» blättern.
3. «Als Tabelle» antippen: die Monate mit ihren Zahlen, neuester zuerst. Ebenso bei Wochentagen, Zonen und Tempo.
