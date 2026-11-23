# Ausflugstipps von überall

PR #? · 23.11.2026 · Auftrag: Noah «1b 2a 3a» (Thread «Challenges nach Gelegenheit bauen»), Schritt 2 von 4. Baut auf dem PR «90 Min» auf.

## Was ist neu
- In «Heute passt: Ausflugstipps» (Touren › Träume) steht neben der Zeitwahl der Knopf «Start: Zuhause». Er öffnet «Wo startest du?» mit drei Wegen: **Zuhause**, **Von hier** (der Standort wird nur auf diesen Tipp erfragt) und die **Suche nach einem beliebigen Ort**.
- Die drei Tipps und «Runde hindurch» rechnen dann von diesem Ort aus («Von Bern durch … und zurück»).

## Was fällt weg oder rutscht tiefer
nichts. Ein Knopf kommt dazu. Das Wetter-Zeichen der Karte gilt nur für Zuhause und ist ausgeblendet, solange ein anderer Start gewählt ist.

## Selbst entschieden
- Die Wahl wird **nicht gespeichert** (kein Datenformat, keine Backup-Änderung): sie gilt, bis man die Seite verlässt. Gemerkte Startorte wären ein eigener Schritt mit Umbenennen und Löschen.
- Der Standort wird nur auf den Tipp «Von hier» abgefragt, bleibt im Fenster und wird nicht abgelegt. Klappt er nicht, steht ein Hinweis mit dem Weg über die Suche.
- Das Wetter für einen fremden Startort zeigen wir nicht (die App holt es nur für Zuhause); lieber nichts als ein falsches Wetter.
- «Plan as a trip» aus der Runde nimmt weiter das Wetter von Zuhause für die Tour.

## Entscheide
nichts Neues (Noah «1b»: beliebigen Ort suchen, siehe `docs/decisions/neuland-90min.md`).

## Stand im Plan
- Challenges nach Gelegenheit: Schritt 2 von 4 gebaut (Zeit, Startort). Es folgen Schwierigkeit und der Absprung aus der Draussen-Karte.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume: in «Heute passt» auf «Start: Zuhause» tippen.
2. Einen Ort suchen (zum Beispiel Aarau) und antippen: die Tipps ändern sich, der Knopf heisst «Start: Aarau».
3. «Von hier» (Standort erlauben) und wieder «Zuhause» ausprobieren.
