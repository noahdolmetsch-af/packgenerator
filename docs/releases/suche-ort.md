# Suche am Ort: Ich, Touren und Auswerten

PR #1783 · 23.11.2026 · Auftrag: Noah «2a» und «3b» (Warteliste 1, Vorschlag V2). Baut auf dem PR «Suche findet mehr» auf.

## Was ist neu
- **Ich:** Hinter dem Titel steht ein Suchfeld «Einstellung suchen». Es findet die Funktionen unter Ich; ein Tipp führt hin. «Überall suchen nach «…»» öffnet die grosse Suche mit dem Wort.
- **Touren:** «Tour oder Fahrt suchen» mit vier Filterknöpfen (Jahr, Velo, Art, Distanz) und der Summe darunter («3 Treffer · 428 km»). Gesucht wird in Fahrten (Strava, Dateien, von Hand) und Touren. Kein Satz wird zerlegt (Noah «3b»): ein Wortfeld, dazu Knöpfe zum Antippen.
- **Auswerten:** «Wert oder Frage suchen» findet die Seiten und Diagramme unter Auswerten.
- Die Tabellen werden erst gelesen, wenn du das Feld oder einen Filter benutzt (Tempo-Regel). Gesundheitswerte erscheinen nur als Seite, nie als Zahl (Noah «5a»).

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeilen «Was du hier tun kannst» und «Gehört zu …» rücken eine Zeile tiefer, weil das Suchfeld vor ihnen steht (Inhalt zuerst: Suchen ist hier der Inhalt).

## Selbst entschieden
- Auf Ich zeigt der Treffer nicht den Schalter selbst (Mockup «Dunkler Modus Hell/Auto/Dunkel»), sondern führt zur Seite der Funktion; der Schalter in der Zeile wäre ein eigenes Stück.
- «Frage» in Auswerten: gesucht werden die Seiten und Funktionen von Auswerten; die eigenen gespeicherten Fragen kommen später dazu.
- «Art» heisst die Quelle (Strava, Datei, von Hand, Tour).
- Auf Touren stehen Touren ohne Kilometer in der Liste, zählen aber nicht in die Summe.

## Entscheide (eigene Datei `docs/decisions/suche-ort.md`)
- 22.11.2026: Noah «2a» (eigenes Feld oben auf Ich, Touren, Auswerten), «3b» (keine Sätze zerlegen).

## Stand im Plan
- Warteliste 1 (Suche): V4 und V1 (PR davor), V2 gebaut; V3 entfällt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich öffnen, «backup» ins Feld tippen: Funktionen erscheinen, ein Tipp führt hin.
2. Touren öffnen, «Distanz» antippen, «über 80 km» wählen: Treffer und Summe stehen unter dem Feld.
3. Auswerten öffnen, «Ruhepuls» tippen: Seiten von Auswerten erscheinen.

Keine Datenänderung.
