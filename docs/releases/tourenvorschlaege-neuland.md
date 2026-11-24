# Tourenvorschläge: Neuland

PR folgt · 24.11.2026 · Auftrag: Noah «1, 2, 3, 4 (wichtig, lieblingsfeature), 5» (Thread «Mehr schwere MTB-Touren», Idee «Neuland»)

## Was ist neu
- Filter «Neuland» (Egal, Neuestes zuerst, Mindestens zur Hälfte neu, Mit neuem Pass oder Gipfel, Neuer Kanton). «Neuestes zuerst» sortiert nach dem Anteil neuer Strecke (`newShare`); die anderen lassen Touren weg, die nicht passen.
- Auf der Karte der Tour sind die Stücke, die du schon gefahren bist (innerhalb von 150 m deiner eigenen Fahrten), grau; die neuen behalten die Farbe der Tour. Eine Zeile unter der Karte erklärt es.
- Neue Kantone: die Karte sagt «Ein neuer Kanton für dich: …», wenn du in diesem Kanton noch nie gefahren bist (Neuland › Kantone zählt).
- Pässe und Gipfel auf dem Weg (Lieblingsfunktion): alle Pässe und Gipfel von Neuland (über 3000 m), die höchstens 500 m neben der Linie liegen, mit Höhe, km auf der Tour und «Neu für dich» oder «Schon erreicht». Auf der Karte als Raute (Pass) und Dreieck (Gipfel) mit Namen; farbig = neu. In der Liste sagt die Zeile der Tour «Neu für dich: …».
- Monatsziel («3 Touren mit über 60 % neu»): bei der Tour von Hand abhaken; Zeile «Ziel im November: 1 von 3 …» unter «Neuland» in den Filtern; «Ziel ändern» (1 bis 5 Touren, über 40/60/80 %) oder ganz ausschalten. Ruhig: nichts passiert, wenn du es nicht schaffst.
- Neu für andere Seiten: `toursNear(tours, lat, lon)` in `src/lib/vorschlaege/neuland.js` liefert die Touren an einem Punkt (das Gipfelbuch kann damit zu einem Gipfel eine Tour zeigen).

## Was fällt weg oder rutscht tiefer
- nichts (eine neue Filtergruppe «Neuland» und ein Abschnitt «Neuland auf dieser Tour» vor «Warum dieser Vorschlag?»).

## Selbst entschieden
- Neuland wird nur gelesen (`computeNeuland` mit Kantonen, Pässen und Gipfeln, samt Gipfelbuch-Besuchen): nichts wird doppelt gezählt, und die Seite schreibt nicht ins Gipfelbuch. Ein Pass wird von Neuland selbst gezählt, sobald eine Fahrt ihn berührt.
- Das einzige Neue, das gespeichert wird, ist das Monatsziel (`settings` «vorschlaege.neuziel»: an/aus, Anzahl, Anteil, abgehakte Touren je Monat). Es ist neu und nur dazugekommen: das Backup enthält es mit allen Einstellungen, kein altes Format ändert sich.
- Das Ziel wird von Hand abgehakt, nicht automatisch: eine Tour aus dem Vorschlag ist nicht zwingend die Fahrt, die man danach macht.
- Ohne eigene Fahrten (kein `grid`) fehlen die Anteile und die graue Strecke, der Text sagt es; «Mindestens zur Hälfte neu» lässt dann alle stehen.
- «Neuestes zuerst» geht vor der Wetter-Sortierung (wer beides wählt, bekommt die neuesten zuerst; das Wetter filtert weiter).

## Entscheide (eigene Datei `docs/decisions/tourenvorschlaege-neuland.md`)
- 24.11.2026: Neuland in den Tourenvorschlägen mit allen fünf Teilen (Noah «1, 2, 3, 4, 5»).

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.
