# Kursblick «Entscheidung», Teil 4: der Reiter «Depot» (Journal, Übungsdepots, Übernahme)

23.11.2026 · Auftrag: Noah «zudem möchte ich … kurskäufe und verkäufe loggen … fiktive käufe … ein digitaler twin meiner richtigen portfolios» und «ok freigabe» (23.11.2026, Thread «Kursblick»); Bauplan `/mnt/project-files/notes/kursblick-entscheidung-bauplan-2026-11-23/bauplan.md`. Baut auf Teil 2 (Journal-Daten, online) auf.

## Was ist neu
- **Neuer Reiter «Depot»** in Kursblick (Adresse `#/kurse/portfolio`; auch in der kleinen App). Alles bisherige bleibt unverändert.
- **Depots:** beliebig viele echte Depots und beliebig viele **Übungsdepots** (erfunden, mit dem Zeichen «Übung»; sie zählen nie für Gesamtbild, Ziele oder Regeln). Hinzufügen, umbenennen, Art ändern, mit Pfeilen verschieben, löschen.
- **Journal:** jeder Kauf, Verkauf, jede Dividende und jeder Split einzeln (Tag, Menge oder Gramm, Preis pro Stück oder Gramm, Gebühr), der neuste zuerst; ändern und löschen mit Rückgängig. Titel: «gold» oder ein Symbol des Kursdienstes (Vorschläge aus «Meine Zahlen» und dem Journal).
- **Posten und Gewinn:** Menge, Durchschnittspreis und Gewinn je Titel, dazu Wert heute, insgesamt bezahlt, aus Verkäufen erhalten, Dividenden, Gewinn aus Verkäufen und Gewinn oder Verlust. Verkäufe mit dem Durchschnittspreis. Fehlt der Preis eines gehaltenen Titels, steht «gerade kein Preis» und der Gewinn wartet; nichts wird geraten.
- **Zu viel verkauft:** ein neuer Verkauf über den Bestand wird mit einem Satz abgelehnt («Trag zuerst den Kauf ein»); ein bestehender Eintrag, der durch Ändern oder Löschen zu gross wird, bleibt und wird markiert (nichts blockiert).
- **Übernahme aus «Meine Zahlen»:** ein Knopf übernimmt die bisherigen Posten als «Eröffnung» ins Journal (Stückzahl und Einstand; ohne Kauftag mit Hinweis). «Meine Zahlen» bleibt unverändert; zweimal übernehmen verdoppelt nichts; Rückgängig für einige Sekunden.
- **Privat:** die Einstellung `kurse.journal` (seit Teil 2), auf dem Gerät, in der Sicherungsdatei, im versiegelten Abgleich. Zum Kursdienst gehen nur die Symbole.

## Was fällt weg oder rutscht tiefer
- nichts. «Meine Zahlen» bleibt, wie es war; «Depot» steht als zusätzlicher Reiter nach «Märkte».

## Selbst entschieden
- **Löschen eines Depots:** das Fenster fragt, wohin die Einträge gehen (in ein anderes Depot) oder dass sie mit gelöscht werden; danach Rückgängig. Das Depot gehört nicht in `GROUP_PLACES`: es ist keine Gruppe, die man wählt, sondern der Behälter der Einträge.
- **Name:** der Reiter heisst «Depot» (englisch «Portfolio»), ein Eintrag «Eintrag», das Übernommene «Eröffnung».
- **Gewichtung, Titel hinzufügen (Aktien, ETFs, Obligationen, Krypto, Immobilien, Sparkonto von Hand) und Gruppen** folgen in Teil 5; hier gibt es das Journal für Gold und jedes Symbol.
- **Preise in Franken:** Titel in anderen Währungen werden mit dem Kurs des Vortags umgerechnet (wie in «Meine Zahlen»); der Preis im Journal ist immer in Franken pro Stück oder Gramm.
- Fertig-Regel: leerer Zustand (Satz und Knopf), nächster Schritt («Weiter zu» wie die anderen Reiter), Funktion bleibt `f.kursblick` (Schritt und «Gut zu wissen»), App-Stand ergänzt.

## Entscheide
- `docs/decisions/kursblick-entscheidung-depot.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Kursblick (vorhaben.md Punkt 19): Teil 4 gebaut; Verteilung mit Zielen, Titel und Gruppen folgen.

## Backup
- Teil 2 hat `kurse.journal` schon eingeführt und mit einer Kopie von Noahs Sicherung geprüft. Dieser PR ändert das Datenformat nicht (nur `loescheDepot` mit Ziel).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Kursblick › «Depot» › «Depot hinzufügen», Namen schreiben, speichern.
2. «Eintragen»: Gold, Tag, 10 Gramm, Preis pro Gramm, speichern. Wert, Durchschnittspreis und Gewinn erscheinen.
3. Ein Übungsdepot hinzufügen (Art «Übung (erfunden)»): es trägt das Zeichen «Übung».
4. Wenn «Meine Zahlen» Posten hat: unten «Übernehmen»; die Einträge heissen «Eröffnung», «Meine Zahlen» bleibt.
5. Einen Eintrag löschen und «Rückgängig» tippen.
