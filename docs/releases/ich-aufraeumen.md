# Ich ist aufgeräumt

Auftrag: Noah 24.11.2026 «K1-K9 und Veloinspektion und Logbuch nach vorne holen. Ich ist ein Hinterzimmer mit 24 Türen» (Thread «Sitemap der App zeichnen», Umsetzungsauftrag PR 1 «Ich aufräumen»)

## Was ist neu
- **Fünf Gruppen, 16 Zeilen** statt vier Gruppen mit 24 Zeilen: Daten (Daten und Backup, Verbindungen, **Dokumente neu**), Erinnerungen, Einstellungen, Hilfe, Mehr (zugeklappt).
- **Dokumente** (`#/me/docs`) ist eine Zeile in Daten.
- **«Erinnerungen und Hinweise»**: eine Zeile statt drei (Erinnerungen, Erinnerungen aufs Handy, Hinweise und News). Die drei Seiten behalten ihre Adressen und führen mit «Weiter zu» (`weiter.js`) ineinander.
- **Verbesserungs-Logbuch** steht jetzt in der Gruppe Hilfe (statt mitten in den Einstellungen).
- «Listen und Checks» heisst in Ich wie die Seite: «Listen und Typen». «Was ist neu» und die Version stehen zusammen in Hilfe.

## Was fällt weg oder rutscht tiefer
- Unter «Mehr» (zugeklappt, ein Tipp mehr): Kleine Apps, Projekt-Ablage (vorher offen in Einstellungen und Hilfe), dazu vorläufig Kursblick und Angebote und Anfragen (Tennis).
- Drei Zeilen für Erinnerungen, Handy-Erinnerungen und Hinweise sind eine (die Seiten sind einen Tipp weiter, über die Zeile und «Weiter zu»).
- Die Zeile «Was die App gelernt hat» entfällt: Auswerten › «Erkenntnisse» und «Heute entdecken» führen dorthin.
- Alle Adressen bleiben gültig.

## Selbst entschieden
- Kursblick und «Angebote und Anfragen» ziehen erst mit dem PR «Woche» (Chips in Woche › Alltag) um; bis dahin liegen sie unter «Mehr», damit nichts weg ist.
- «Mehr» zeigt auch weiter «Aufräumen von Testdaten».
- Der Satz unter «Mehr» nennt jetzt Kleine Apps, Projekt-Ablage, KI-Projekte, Ausprobieren.
- Keine Datenänderung: kein Dexie-Schema, kein Backup-Format, kein `api/`, kein Sync.

## Entscheide (eigene Datei `docs/decisions/ich-aufraeumen.md`)
- 24.11.2026: Ich in fünf Gruppen, eine Zeile für Erinnerungen.

## Stand im Plan
- Sitemap-Auftrag: Schritt 1 «Ich aufräumen» gebaut; Logbuch im Neu-Menü und «?» folgt als Schritt 7.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich öffnen: fünf Gruppen, unter «Daten» die Zeile «Dokumente», unter «Erinnerungen» eine Zeile.
2. «Erinnerungen und Hinweise» antippen, am Seitenende «Weiter zu» antippen: Handy-Erinnerungen und Hinweise öffnen.
3. «Mehr» aufklappen: Kleine Apps, Projekt-Ablage, KI-Projekte, Ausprobieren, Kursblick, Angebote und Anfragen.
