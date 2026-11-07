# Liste per Satz

PR (Nummer folgt) · 07.11.2026 · Auftrag: Noah «1b 2a 3a 4a 5a» (Thread «Erklären: mit der App sprechen und Befehle ausführen»), Etappe 1 von 2

## Was ist neu
- Ein Satz wie «Erstelle eine To-Do-Liste mit folgenden Inhalten. Erstens Aufräumen, zweitens Kette wachsen, drittens Anmeldung für das Rennen» legt in Kalender › Merken eine Liste «To-do» mit drei Punkten an. Gesprochen (Mikrofon in der Suche) läuft es sofort, getippt steht die Zeile unter «Jetzt erledigen».
- Danach zeigt die Meldung «Öffnen» (die Liste) und «Rückgängig» (nimmt die ganze Liste zurück).
- Erkannt per Regeln (`listOf` in `src/lib/suche/say.js`): ein Verb (erstelle, mach, leg, schreib), das Wort «Liste» (auch «Einkaufsliste»), ein Name davor oder danach, die Punkte nach «:» oder «mit». Punkte werden bei Komma, «und», «sowie», Punkt und «erstens …» getrennt.
- Ohne Internet, ohne KI, nichts verlässt das Handy.

## Was fällt weg oder rutscht tiefer
- nichts. Bei einem Listen-Satz zeigt die Suche keine «Die App antwortet»-Antwort und kein «Als neues Material erfassen» mehr daneben, weil beides dort nur störte.

## Selbst entschieden
- «Und» trennt immer Punkte («Brot und Käse» sind zwei). Falsch getrennt? In der Liste ändern.
- Ohne Name heisst die Liste «Neue Liste»; «To-Do» wird zu «To-do».
- Alle Punkte kommen als Kästchen zum Abhaken (wie «Mit Kästchen» im Listenfenster).
- Fertig-Regel: keine neue Funktion, also keine neue Seite; Beispiel steht in Ich › Suche und im Sprachsuche-Eintrag von `app-stand.md`. Ein Eintrag in «Gut zu wissen» und ein neuer Beispiel-Knopf (die Prüfung verlangt genau 3) entfallen.

## Entscheide (für decisions.md)
- 07.11.2026: Mit der App sprechen, Etappe 1 und 2 gleichzeitig (Noah «1b»); freie Sätze nur mit Gemini (2a); Regel-Sätze sofort mit Rückgängig, KI-Sätze erst mit Vorschau (3a); Satz plus Namen der Velos/Touren dürfen zur KI (4a); neue Aktionen in der Reihenfolge Packliste, Velo anlegen, Tour verschieben (5a).

## Stand im Plan (roadmap.md / vorhaben.md)
- Sprachbefehle: Etappe 1 (Liste per Regeln) gebaut; Etappe 2 (freie Sätze mit Gemini, ändert `api/`) folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Suchfeld oben antippen, «Erstelle eine To-Do-Liste: Aufräumen, Kette wachsen, Anmeldung fürs Rennen» tippen: unter «Jetzt erledigen» steht «Liste «To-do» mit 3 Punkten».
2. Enter drücken, dann «Öffnen»: die Liste zeigt die drei Punkte.
3. Das Mikrofon antippen und denselben Satz sagen: die Liste wird sofort angelegt. «Rückgängig» nimmt sie weg.
