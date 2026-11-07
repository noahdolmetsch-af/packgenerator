# Neuland rechnet nicht mehr jedes Mal alles neu

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «Idee A: Tempo-Runde für Seiten» (Thread «Umsetzen Tempo-Runde für Seiten»)

## Was ist neu
- Heute («Neu gesammelt»), Neuland, Träume und die Tourtipps fragen alle dasselbe: welche Gemeinden, Pässe, Seen und Gipfel deine Fahrten erreicht haben. Das ist die schwere Rechnung (Flächen gegen Linien). Bisher rechnete jede Seite sie neu.
- Jetzt merkt sich die App das Ergebnis pro Sammlung (höchstens 40 Sammlungen, nur im Arbeitsspeicher, nichts wird gespeichert), solange die Orte der Sammlung und die Fahrten gleich sind. Eine neue oder geänderte Fahrt, ein verschobener oder neuer Ort oder ein anderer Tag gibt eine neue Rechnung.
- Gemessen (Handy-Ansicht, Prozessor 4× langsamer, 700 Testteile, 5 Wechsel): blockierte Zeit beim Öffnen von Neuland 0.39 s → 0.24 s; im Profil der Aufbau der Suchraster 144 ms → 0. Das gilt ab dem zweiten Öffnen in einer Sitzung; das allererste Mal rechnet wie vorher.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur im Arbeitsspeicher, nicht in der Datenbank: kein neues Schema, kein Backup-Format, nach einem Neustart der App rechnet sie einmal neu.
- Der Schlüssel besteht aus der Kennung, der Art, dem Radius, der Anzahl, einer Prüfsumme der Orte und einer Prüfsumme jeder Fahrt (Tag, Anzahl Punkte, Summe der Koordinaten).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Tempo-Runde für Seiten (Idee A, «Neuer Schwung»): Schritt 2 von 4. Bericht: notes/tempo-runde-2026-11-05/README.md.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Neuland öffnen, zurück zu Heute, Neuland nochmals öffnen: die Seite erscheint ohne Ruckeln.
2. In einer eigenen Sammlung einen Ort hinzufügen, der auf einer deiner Fahrten liegt: er wird wie bisher abgehakt.
