# Kursblick «Entscheidung», Teil 3: der Reiter für Gold (Trend, Lage, Kaufregel, Rückblick)

23.11.2026 · Auftrag: Noah «1, 3 und 4 zusammen» und «ok freigabe» (23.11.2026, Thread «Kursblick»); Bauplan `/mnt/project-files/notes/kursblick-entscheidung-bauplan-2026-11-23/bauplan.md`. Baut auf Teil 1 (Rechnen, online) auf.

## Was ist neu
- **Neuer Reiter «Entscheidung»** in Kursblick (`#/kurse/entscheidung`, auch in der kleinen App `apps/kursblick/`), nur für Gold; alles bisherige bleibt unverändert (Heute, Gold mit Referenztag, Märkte, Meine Zahlen, Quellen).
- **Trend:** grün, gelb oder rot mit einem Satz (der Preis gegen das Mittel der letzten 50 und 200 Schlusskurse) und dem Abstand in Prozent.
- **Wo der Preis steht:** zwischen dem tiefsten und höchsten Schlusskurs der letzten fünf Jahre (unteres Fünftel «günstig», oberes Fünftel «sehr teuer»).
- **Meine Kaufregel:** Betrag pro Monat, Faktor bei Rot, Faktor bei sehr teuer (Nichts, Die Hälfte, Wie üblich, Anderthalb, Das Doppelte); gilt beides, werden die Faktoren multipliziert. Der Vorschlag nennt Franken und Gramm und sagt, warum.
- **Rückblick:** die Regel am ersten Handelstag jedes der letzten 60 Monate gegen «jeden Monat gleich viel»: eingezahlt, Gramm, Durchschnittspreis pro kg, Wert heute, dazu der Unterschied und eine Tabelle Monat für Monat. Ohne Betrag steht stattdessen ein Satz, was zu tun ist.
- **Privat:** die Regel steht in der neuen Einstellung `kurse.regeln` (eine Regel pro Titel, jetzt `gold`), auf dem Gerät, in der Sicherungsdatei und im versiegelten Abgleich; zum Kursdienst geht nichts davon. Kein neues Dexie-Schema.
- **Texte:** jeder Reiter-Inhalt endet mit dem Satz, dass es Beobachtungen und das Ergebnis der eigenen Regel sind, keine Vorhersage und keine Anlageberatung.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- **Kleiner als im Bauplan:** PR 3 enthält nur Trend, Lage, Kaufregel und Rückblick für Gold. «Gewichtung» und «Depot» brauchen das Journal und die Gruppen und kommen mit den nächsten PRs (Journal und Depots als Oberfläche, Portfolio mit Verteilung).
- **Betrag wird beim Tippen gespeichert**, damit der Vorschlag sofort folgt; ein Komma zählt als Punkt.
- **Keine neue Funktion in `features.js`:** wie «Meine Zahlen» gehört der Reiter zu `f.kursblick` (Schritt, «Gut zu wissen» und «Was ist neu» erweitert). Der Absprung bleibt der von Kursblick (Ich-Seite, Währungsrechner).
- Fertig-Regel: leerer Zustand (ohne Betrag erklärt ein Satz den nächsten Schritt), nächster Schritt («Weiter zu» wie die anderen Reiter), App-Stand ergänzt.

## Entscheide
- Siehe `docs/decisions/kursblick-entscheidung.md` (keine neuen).

## Stand im Plan (roadmap.md / vorhaben.md)
- Kursblick (vorhaben.md Punkt 19): Teil 3 gebaut; Journal und Depots (Oberfläche) und Portfolio folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Kursblick › «Entscheidung»: der Trend zeigt grün, gelb oder rot mit einem Satz, darunter wo der Preis steht.
2. Unter «Meine Kaufregel» 500 eintragen: Vorschlag für diesen Monat und Rückblick erscheinen.
3. «Wenn der Trend rot ist» auf «Das Doppelte» stellen: Vorschlag und Rückblick folgen; nach dem Neuladen ist die Regel noch da.
4. Die anderen Reiter (Heute, Gold, Märkte, Meine Zahlen) sind wie vorher.
