# Kursblick Übungsdepot, Teil 1: der Schlusskurs des Tages füllt den Preis ein

24.11.2026 · Auftrag: Noah «ein fiktives Portfolio … fiktive Ein- und Verkäufe … zum Kurs von damals» und «2a» (Thread «Kursblick», 24.11.2026). Erster von drei kleinen Schritten zum Übungsdepot (danach Startkapital, danach «Liste einlesen»).

## Was ist neu
- Im Fenster «Kauf oder Verkauf eintragen» steht beim neuen Eintrag nach Titel und Tag der **Schlusskurs dieses Tages in Franken** im Preisfeld (`preise.js` `schlussAm`). Er ist änderbar: Schreibt die Person selbst einen Preis, bleibt er; «Diesen Schlusskurs nehmen» holt ihn zurück.
- **Wochenende oder Feiertag:** es gilt der letzte Handelstag davor (höchstens 14 Tage zurück), der Text sagt es («Schlusskurs vom …»).
- **Wechselkurs desselben Tages** für Titel in Dollar, Euro und so weiter (nicht der heutige); Gold wie im Reiter Gold (Dollar je Unze mal Dollarkurs des Tages, je Gramm).
- Ohne Kursreihe, ohne Kurs des Tages oder ohne Wechselkurs bleibt das Feld leer und der Text sagt es: nichts wird geraten.
- Zum Kursdienst geht nur das Symbol; Menge und Preis bleiben auf dem Gerät.

## Was fällt weg oder rutscht tiefer
- nichts. Beim Ändern eines bestehenden Eintrags wird nichts überschrieben; dort bietet der Text den Schlusskurs nur an.

## Selbst entschieden
- Auto-Einsetzen erst nach 0,4 s Pause beim Tippen, damit nicht bei jedem Buchstaben gefragt wird.
- Der heutige Tag hat noch keinen Schlusskurs (Schlusskurs vom Vortag, wie überall in Kursblick): es gilt der letzte Handelstag davor.
- Fertig-Regel: kein neuer Ort, darum keine neue Seite, kein neuer Absprung und kein neuer leerer Zustand; `f.kursblick` bleibt, der App-Stand ist ergänzt.

## Entscheide
- `docs/decisions/kursblick-schlusskurs-tag.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Kursblick (vorhaben.md): Übungsdepot mit Kauf zum Kurs von damals begonnen; Startkapital und «Liste einlesen» folgen.

## Backup
- keine Datenänderung: es gibt keine neue Einstellung und kein neues Feld; ein Eintrag sieht aus wie bisher.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Kursblick › «Depot», ein Übungsdepot anlegen, «Kauf oder Verkauf eintragen».
2. Titel NESN.SW, einen Tag im letzten Monat wählen: nach einem Moment steht der Schlusskurs im Preisfeld.
3. Einen Sonntag wählen: der Text sagt, dass der letzte Handelstag davor gilt.
4. Selbst einen Preis schreiben: er bleibt; «Diesen Schlusskurs nehmen» holt den Schlusskurs zurück.
