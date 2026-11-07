# Weg zum Ziel: Schrittart «Trainingsfortschritt»

PR # · 07.11.2026 · Auftrag: Noah «a» (Thread «Planen: Trainingsfortschritt im Weg», 05.11.2026: der Haken setzt sich von selbst)

## Was ist neu
- Nichts Sichtbares. Es kommt die Schrittart `training` für «Weg zum Ziel» dazu (`src/lib/weg/types/training.js`, eine Zeile in `types/index.js`). Die Seite folgt als K2.
- Drei Standardschritte als Vorschlag: «Trainings-Check» 8, 4 und 2 Wochen vor dem Start (feste Kennungen `check8`, `check4`, `check2`).
- Jeder Check schaut auf die Woche seines Tages und zeigt drei Zeilen: «Plan läuft» (die Woche hat Einheiten im Wochenplan), «Wochenziel» (gemachte Minuten gegen geplante, erreicht ab 80 %) und «Längste Fahrt gegen das Etappenziel» (z. B. 95 von 90 km; das Etappenziel ist die längste Fahrt der Woche im Aufbau des Rennens, `trainingPlan()` in `race.js`).
- Haken von selbst, wenn alle drei stimmen. Sonst bleibt der Schritt ruhig offen und kann von Hand abgehakt werden. Ohne Etappenziel (kein Renntag-Länge) genügen Plan und Wochenziel.
- Link: `#/flow/plans?race=<Starttag>` (Trainingspläne).
- `load(db)` liest Wochenplan und Aktivitäten; die Seite legt das Ergebnis unter `ctx.training` ab und gibt `today` und `dayKm` (km eines durchschnittlichen Renntags) mit. `say(line)` liefert die ruhigen Texte (nie «gescheitert», sondern «60 von 300 Min.»).
- Deutsche Texte: `src/lib/i18n/de/weg-training.js`.
- `tests/weg-training.test.js`: 22 Tests (Vorschläge, Woche, Etappenziel, Zeilen, 80 %-Grenze, Haken von selbst, nie zurück, nie wieder nach Abwählen, leere und kaputte Daten, `load` mit Test-Datenbank).

## Was fällt weg oder rutscht tiefer
- nichts (keine Oberfläche, keine Datenänderung: keine neue Ablage, kein Backup-Format)

## Selbst entschieden
- Keine «Was ist neu»-Datei und keine Zeile in `docs/app-stand.md`: es gibt noch keine Seite (wie im Gerüst-PR). Die Zeile «Weg zum Ziel» gehört dem Seiten-Thread.
- Das Wochenziel ist der Wochenplan aus Aktiv › Training: Minuten aus Strava-Aktivitäten (jede Sportart zählt) oder von Hand abgehakte Einheiten, die grössere Zahl, damit nichts doppelt zählt. Es zählt nur bis heute.
- Das Etappenziel wird so gerechnet, wie die Rennseite es heute zeigt (vom heutigen Tag aus); für eine vergangene Woche vom Montag dieser Woche aus. In der Rennwoche und bei freien Zielen ohne Renntag-Länge gibt es keins («keine Messung», kein Haken-Hindernis).
- Eine Woche, die noch nicht begonnen hat, steht auf «später», nicht auf «offen».
- Keine Zeile in `FEATURE_MOMENTS`: keine neue Funktion in `features.js`.

## Entscheide (für decisions.md)
- 05.11.2026: Trainingsfortschritt: Haken von selbst bei 80 % Wochenziel und längster Fahrt gleich oder über dem Etappenziel (Noah «a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G, Schrittart 3: Logik gebaut, sichtbar mit der Seite (K2).

## Prüfschritte
Nichts zu prüfen auf der Seite. Die Tests laufen auf GitHub (build, e2e desktop).
