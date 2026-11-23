# Kursblick «Entscheidung», Teil 5: Gesamtbild mit Gruppen, Zielen und Werten von Hand

23.11.2026 · Auftrag: Noah «einzelne neue Aktien … Obligationen. ETFs», «Krypto, Rohstoffe, Immobilien, Sparkonto», «können wir das noch besser machen, dass das Gesamtportfolio besser integriert ist» und «ok freigabe» (23.11.2026, Thread «Kursblick»); Bauplan `/mnt/project-files/notes/kursblick-entscheidung-bauplan-2026-11-23/bauplan.md`. Baut auf Teil 1 (Rechen-Code `verteilung`, `widersprueche`), Teil 3 (Kaufregel) und Teil 4 (Depot) auf.

## Was ist neu
- **«Dein Gesamtbild»** unten im Reiter «Depot» (`Verteilung.svelte`, Rechnen in `verteilung.js`): Gruppen mit Anteil jetzt, Ziel in Prozent und Abstand (Punkte und Franken), mit einem Balken und einer Marke für das Ziel.
- **Gruppen:** Gold, Aktien und Fonds, Obligationen, Krypto, Immobilien, Sparkonto und Bargeld als Vorschlag. Alle lassen sich umbenennen, hinzufügen, verschieben und löschen (die Titel und Werte gehen in eine andere Gruppe oder bleiben ohne Gruppe; nie wird etwas mit gelöscht; Rückgängig).
- **Spielraum** in Punkten (Standard 5): eine Gruppe wird erst markiert, wenn sie weiter vom Ziel weg ist.
- **Titel einordnen:** jeder Titel der echten Depots (Aktie, ETF, Obligation, Krypto per Symbol) wird einer Gruppe zugeordnet; Gold liegt von selbst in «Gold». «Noch nicht eingeordnet» zeigt, was noch fehlt, und zählt trotzdem für das Ganze.
- **Werte von Hand:** Sparkonto, Säule 3a, Wohnung, Münzen: Name, Gruppe, Wert in Franken; ändern und löschen mit Rückgängig.
- **Regel gegen Ziel:** liegt Gold über dem Ziel und die Kaufregel würde heute kaufen (oder liegt es darunter und die Regel kauft weniger), steht ein Satz dazu; du entscheidest, was gilt.
- **Privat:** neue Einstellung `kurse.verteilung`, auf dem Gerät, in der Sicherungsdatei, im versiegelten Abgleich. Zum Kursdienst gehen weiterhin nur die Symbole.

## Was fällt weg oder rutscht tiefer
- nichts. «Depot», «Entscheidung» und «Meine Zahlen» bleiben, wie sie waren; das Gesamtbild steht unter dem Journal.

## Selbst entschieden
- **Nur echte Depots zählen** für das Gesamtbild (Übungsdepots nie), wie angekündigt.
- **Titel hinzufügen** läuft über das Journal (Symbol im Eintrag) und das Einordnen; eine zweite Titelliste gibt es nicht.
- **Gruppen** sind in `GROUP_PLACES` eingetragen (Umbenennen, Löschen mit `GroupDeleteSheet`, Rückgängig). Namen, die die Person schreibt, gehen nie durch `t()`; die sechs Vorschläge tragen einen Standardnamen und kommen mit «leer = Standardname» zurück.
- **Ziele müssen nicht 100 ergeben** (ein Hinweis zeigt die Summe).
- Fertig-Regel: leerer Zustand (Satz und Knopf «Wert von Hand»), Funktion bleibt `f.kursblick` (Schritt und «Gut zu wissen» ergänzt), App-Stand ergänzt.

## Entscheide
- `docs/decisions/kursblick-entscheidung-verteilung.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Kursblick (vorhaben.md Punkt 19): Teil 5 gebaut; die Entscheidungshilfe ist damit vollständig.

## Backup
- Neue Einstellung `kurse.verteilung` (Schlüssel/Wert, kein neues Dexie-Schema). Sie reist mit der Sicherung und dem Abgleich wie die anderen Einstellungen; ein altes Backup ohne sie startet mit den Standardgruppen. `tests/kurse-privat.test.js` prüft, dass sie nicht zum Kursdienst geht.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Kursblick › «Depot», nach unten zu «Dein Gesamtbild».
2. «Wert von Hand»: «Sparkonto», Gruppe «Sparkonto und Bargeld», 5000, speichern. Das Bild zeigt CHF 5’000.
3. Ziel 50 bei «Sparkonto und Bargeld» schreiben: ein Satz sagt, wie weit du weg bist.
4. Eine Gruppe umbenennen und eine löschen, dann «Rückgängig».
