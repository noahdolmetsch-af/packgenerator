# Lieblingsteile zuerst

PR #1783 · 23.11.2026 · Auftrag: Noah «2a» (Thread «Packen nach Taschen am Bike ausbauen»)

## Was ist neu
- Ein Teil mit Stern (★) kommt bei gleicher Eignung zuerst: bei «Lücken füllen» der Zwiebel, beim Tauschen eines getragenen Teils und bei «Was ziehe ich heute an?» (Heute, Anprobe).
- Das vorgeschlagene Lieblingsteil trägt die Marke «★ Dein Liebling» (im Tauschen-Fenster mit deinem Grund, wenn du einen genannt hast).

## Was fällt weg oder rutscht tiefer
- nichts. Ein Teil ohne Stern wird weiter vorgeschlagen, wenn kein Lieblingsteil passt.

## Selbst entschieden
- «Gleiche Eignung» heisst: das Teil hält die Temperatur (bei Kälte mit Luft zur Grenze) und, wenn es regnet, das Regenzeug. Unter diesen Teilen geht der Stern vor der näheren Temperaturgrenze und vor dem leichteren Teil. Die Regel «nur Teile mit Temperaturbereich bei Kälte» bleibt unverändert.
- Im Tauschen-Fenster zählt eine frühere Wahl von dir mehr als der Stern: der Stern ordnet erst danach.
- Kein neues Feld, keine Datenänderung: `item.favorite` gibt es schon.

## Entscheide (eigene Datei `docs/decisions/lieblingsteile-zuerst.md`)
- 23.11.2026: Lieblingsteile zuerst bei gleicher Eignung, mit Hinweis «Dein Liebling» (Noah «2a»)

## Stand im Plan (roadmap.md / vorhaben.md)
- Packen nach Taschen am Bike (Leitfaden): Schritt 1 von 3 (Lieblingsteile, dann Gesamtgewicht, dann «Tasche lernen»)

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Im Kleiderschrank ein Teil mit Stern markieren.
2. Packliste einer Tour mit kaltem Wetter öffnen, Zeile «Zwiebel» aufklappen: wo eine Lücke steht, steht «★ Dein Liebling» unter dem Knopf.
3. Ein getragenes Teil antippen (Tauschen): die passenden Teile mit Stern stehen vorn.
