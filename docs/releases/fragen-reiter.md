# Fragen: erster Reiter in Auswerten

PR #1226 · 09.11.2026 · Auftrag: Noah «D b» und «ok» (Plan «ganze App», Schritt 4a; Thread «Tour A–Z / Datencenter»)

## Was ist neu
- Neuer Reiter «Fragen» (`#/auswerten/fragen`, `src/pages/Fragen.svelte`) als **erster** Reiter in Auswerten, vor «Übersicht». Sechs Fragen, je eine pro Gruppe aus dem Entwurf: Liegt mein Ruhepuls in meinem Üblichen? Werde ich schneller? Wie ging es mir vor und nach meiner letzten Tour? Schlafe ich nach einem Tag mit Fahrt kürzer? Was ist bei meinen Velos fällig? Wie ist dieses Jahr gegen das letzte?
- Jede Antwort ist ein Satz mit der Zahl und ihrer Grenze («Beobachtung, keine Ursache», Zahl der Tage). «Warum? Wie gerechnet» zeigt die Regel, «Mehr dazu» öffnet die Seite mit den Zahlen dahinter. Bei zu wenig Daten steht «Zu wenige … für eine Aussage» mit den Zahlen, es wird nicht geraten.
- Gerechnet wird nur mit dem, was es gibt: der persönliche Bereich aus `signals.js`, die Zeiträume aus `compare.js`, die Pflege aus `care.js`. Die Regeln liegen rein in `src/lib/fragen/fragen.js` (Tests: `tests/fragen.test.js`), die Seite macht die Sätze daraus.
- Die Suche kennt «Fragen», «Frag deine Daten» und «Werde ich schneller» und führt zum Reiter (`src/lib/search.js`, Befehl `fragen`). Eine Zeile «Frag mit eigenen Worten» führt zum Assistenten.
- Sind alle sechs ohne Daten, sagt die Seite warum und führt zu «Meine Datenquellen».

## Was fällt weg oder rutscht tiefer
- nichts. «Übersicht» ist nur um einen Platz nach hinten gerutscht; Auswerten (`#/auswerten`) öffnet weiter die Übersicht.

## Selbst entschieden
- **Entwurf gegen Bild:** weicht ab, weil der Entwurf 1 die Fragen als Einstieg über der Übersicht zeigt, mit einer Suchzeile und «Das fällt auf» darunter; gebaut ist der Reiter als eigene Seite mit sechs Karten. «Das fällt auf» fehlt wie im Auftrag (kommt mit 7b). Die Reihenfolge der sechs Gruppen und die Wörter sind aus dem Entwurf.
- Auswerten öffnet weiter mit der Übersicht (`#/auswerten`), «Fragen» ist der erste Reiter, aber nicht die Startseite. Soll Fragen die Startseite sein, ist das eine Zeile in `nav.js`; Noahs Entscheid.
- Eine Frage pro Gruppe, nicht 17. Gewählt wurde die Frage, die mit den vorhandenen Regeln ehrlich zu beantworten ist («geht» oder «teils» im Entwurf). «Wie lief die Tour?» zeigt vor und nach der letzten beendeten Tour (Schlaf, Ruhepuls); «Plan gegen Ist» kommt mit dem Tourprofil (4b).
- «Werde ich schneller?» vergleicht das mittlere Tempo der Fahrtage der letzten 90 Tage mit den 90 davor und sagt dazu, dass die Strecken verschieden sein können; gleiche Strecken zu finden wäre eine neue Rechenart.
- Schwellen: 5 Fahrtage je Seite, 8 Nächte je Seite, 14 Tage mit Ruhepuls, 3 Tage nach der Tour. Darunter: «zu wenig».
- Suche: ein Befehl, der zum Reiter führt, nicht eigene Fragezeilen mit Antwort in der Suche. Die Antwort in der Suche kommt mit Schritt 6 (Entscheid 8 a, «nach 4a»).
- Nicht umgesetzt von der Fertig-Regel: «Gut zu wissen» (die Seite steht nicht in `ON_PAGES`, wie «Meine Datenquellen»; die Seite erklärt sich selbst), «Passt hier» (der Absprung ist der Reiter und die Suche).
- Tests: `tests/fuenforte.test.js` erlaubt 18 statt 17 Reiter in Auswerten; `tests/bedienung.test.js` kennt den neuen Befehl der Suche. Beides wegen dieser Änderung.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App»: Schritt 4a steht auf gebaut (#1226). Danach 2a, dann 2b, dann Pause für die echte Tour.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Auswerten öffnen: ganz links steht der Reiter «Fragen». Tippen: sechs Karten.
2. Eine Antwort lesen: ein Satz, darunter die Grenze. «Warum? Wie gerechnet» öffnen.
3. «Mehr dazu» tippen: die Seite mit den Zahlen öffnet sich. In die Suche «Fragen» tippen: der Reiter wird angeboten.
