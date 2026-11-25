# Aktionen in Auswerten: eine neue Frage meldet sich mit «Rückgängig» und «Ansehen»

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «1-5a» (Prüfung «Aktionen in Auswerten», Entscheid 2a), Teil 3 von 5

Ziele von Noah (23.11.2026 18:09): **Klarheit** (die App sagt, dass die Frage gespeichert ist und wann sie kommt) und **Auffindbarkeit** (ein Tipp bringt dich zur neuen Frage). Leitfaden `docs/leitfaden.md`: «Eine App, die mich im Alltag unterstützt» (nichts geschieht still).

## Was ist neu
- «Wi gaht's?» › «Eigene Frage anlegen»: nach «Speichern» zeigt ein Hinweis «Frage gespeichert. Sie kommt täglich · 20:00.» (Rhythmus und Zeit aus der Eingabe) mit «Rückgängig» und «Ansehen». Ist die Frage ausgeschaltet, steht «Frage gespeichert. Sie ist ausgeschaltet.».
- «Rückgängig» nimmt die Frage wieder weg (stellt den vorherigen Stand der Einstellungen her). «Ansehen» klappt die Gruppe der Frage auf, springt zur Frage und hebt sie kurz hervor (2,5 s; ohne Animation, wenn das Gerät Bewegung reduziert).
- Der gemeinsame Hinweis (`offerDone`) kann jetzt eine zweite Taste tragen (`action`), nicht nur «Rückgängig».

## Was fällt weg oder rutscht tiefer
- nichts. Vorher geschah nach dem Speichern nichts Sichtbares ausser dem Schliessen des Fensters.

## Selbst entschieden
- Der Hinweis nennt Rhythmus und Zeit mit dem Wort der Liste («täglich · 20:00»), wie überall auf der Seite (`everyText`), nicht einen eigenen Satzbau.
- Nur bei einer **neuen** Frage; beim Ändern einer bestehenden bleibt es, wie es war.
- Kein Daten-, Backup- oder `api/`-Eingriff: dieselbe Einstellung wie bisher; Rückgängig schreibt den alten Stand zurück.

## Entscheide
- Noah 23.11.2026 19:49 «1-5a», Entscheid 2a. Siehe `docs/decisions/rueckgaengig-acht-sekunden.md` (Nachtrag).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Aktionen in Auswerten»: Teil 3 gebaut; offen: Löschen-Regel, «Stufen ändern».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Wi gaht's? › «Eigene Frage anlegen»: Name eintragen, speichern: Der Hinweis sagt, wann die Frage kommt.
2. «Ansehen» antippen: die Seite springt zur Frage, sie leuchtet kurz.
3. Noch eine anlegen und «Rückgängig» antippen: die Frage ist wieder weg.
