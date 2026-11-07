# Meine Datenquellen

PR folgt · 07.11.2026 · Auftrag: Noah «1a» (Thread «Tour A–Z / Datencenter», Schritt 0, PR B)

## Was ist neu
- Neue Seite «Meine Datenquellen» (`#/auswerten/quellen`, `src/pages/Quellen.svelte`): Fitbit, Strava, Tagescheck «Wi gaht's?», Touren mit Rückblicken und Velos, je mit Menge, letztem Stand und Lücken (Tage ohne Wert in den letzten 14 Tagen, lange keine neuen Daten). Wetter und Kosten nennen ihre Grenze, damit keine Antwort mehr verspricht, als die Daten tragen.
- Jede Zeile führt zur Stelle, an der die Quelle eingerichtet wird (die Wege aus `zahlweg.js`, #1109). Die Regeln liegen in `src/lib/quellen/quellen.js`, mit Tests.
- Weg hinein: unter der Liste in Ich › Verbindungen. Ist nichts verbunden und nichts erfasst, sagt die Seite das und führt zu den Verbindungen.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur Anzeige. Der Schalter «Quelle abwählen» aus dem Entwurf fehlt noch: er müsste in die Analyse-Seiten eingreifen, die gerade andere Threads umbauen (`AnalyseWert`, `Analyse`, `AuswertenStart`). Er kommt als eigener PR danach. Ein Schalter, der nichts bewirkt, wäre falsch.
- Der Einstieg im Auswerten-Start («Datenquellen · Fitbit heute 07:12 …») fehlt aus demselben Grund; bis dahin führt der Link in Verbindungen hierher.
- Zwei Entwurfs-Zeilen fehlen noch: «Kosten» zeigt «noch nicht erfasst» (bis es ein Tour-Budget gibt, dann wird die Zeile ersetzt); «Wetter» nennt nur die Grenze.
- Keine «an»/«aus»-Schilder in den Zeilen: sie wären ohne Schalter nur eine zweite Aussage zum Stand. Die Zeile sagt selbst, ob etwas fehlt oder nicht verbunden ist.
- Der Stand von Fitbit sagt den letzten Tag mit Werten, nicht die Uhrzeit (die Uhrzeit wird nicht gespeichert).
- Ort: Teil von Auswerten (`placeOf` 'analysis'), kein eigener Reiter, Zurück-Pfad «‹ Auswerten».
- Nicht umgesetzt von der Fertig-Regel: «Gut zu wissen»-Text (die Seite hat die Karte «Was du hier tun kannst» nicht), «Passt hier»-Zeile (der Absprung ist der Link in Verbindungen, der Test `absprung` ist grün).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Tour A–Z / Datencenter, Schritt 0 (Datenquellen-Seite): gebaut. Danach: Tour-Pfad (Schritt 1).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Verbindungen öffnen, unten an der Liste «Sieh, woher deine Zahlen kommen» antippen: «Meine Datenquellen» öffnet sich.
2. Fitbit und Strava zeigen den letzten Stand und die Menge; fehlen Tage, steht es darunter.
3. Wetter und Kosten nennen ihre Grenze. «Verbindungen verwalten» führt zurück.
