# Nach einem Update: jede Neuheit testen

PR (offen) · 27.11.2026 · Auftrag: Noah «1b 2a 3b 4b 5a» (Thread «Alle Releases mit Testanleitung auflisten»)

Teil 2 bis 5 der Release-Liste in **einem** Paket (Noah 4b): Nach einem Update zeigt Heute eine kleine Karte mit den zwei neuesten Neuheiten, jede mit ihrer PR-Nummer, dem ersten Testschritt, «Zeig mir», «Klappt» und «Klappt nicht». Ich › Was ist neu zeigt zu jedem Update die PR und alle Schritte und filtert.

## Was ist neu
- **Karte auf Heute** statt der schmalen Zeile (`NewsBanner.svelte`): Titel bricht um, nie abgeschnitten («Text abgeschnitten», Noah 27.11.). Je Neuheit: Titel, «PR n · Version x», erster Testschritt (+ «+ 2 weitere Schritte»), «Zeig mir», «Klappt», «Klappt nicht». Darunter «+N weitere» und «Alle Neuheiten mit Testanleitung ›».
- **Fenster «Nach Update»** (`NeuSeitSheet.svelte`, öffnet über «+N weitere»): jede Neuheit seit dem letzten Besuch mit PR, Satz, allen Schritten und den Antworten (höchstens 30, dann ein Hinweis auf die ganze Liste). Der Schalter «Nach Ort» bringt die Ansicht von früher zurück; die Karte am Ende von Heute öffnet weiter nach Ort.
- **«Klappt»** schreibt einen Eintrag ins Verbesserungs-Logbuch (Art «Gut so», Quelle `test`, Feld `release` mit Version, PR, Titel) und bietet Undo. **«Klappt nicht»** öffnet das Fenster von «Verbessern» mit der Art «Fehler», dem Release im Kopf und leerem Satz zum Ausfüllen; gespeichert wird ein normaler Eintrag mit `release`. Das Logbuch zeigt Release und PR am Eintrag, «Auftrag kopieren» nennt sie.
- **Antwort pro Version auf dem Gerät** (`wasneu.results` im localStorage, ein leichter Index; das Logbuch bleibt die Wahrheit): so liest Heute nie das Logbuch mit seinen Fotos.
- **Ich › Was ist neu › Alle Versionen**: PR-Nummer in jeder Zeile, aufgeklappt Schritte und die zwei Antworten; die Suche findet auch «1820», «#1820» oder «pr1820»; Chips Alle, Neu für dich, Noch nicht getestet, Klappt, Klappt nicht, **Unsichtbar** (die 250 Releases ohne sichtbare Änderung, «Nichts zu testen»).
- Neues Wort: **Testrunde** (`docs/namen.md`).

## Was fällt weg oder rutscht tiefer
- Die schmale Zeile «Neu: … und 2 weitere Dinge · Zeig mir ×» wird eine Karte (grösser, dafür mit Testanleitung). Der Inhalt von Heute rutscht auf dem Handy um die Höhe der Karte nach unten (rund 300 px; Noah hat die Karte gewählt, 1b).
- Das Fenster hinter «+N weitere» öffnet jetzt «Nach Update» statt «Nach Ort»; «Nach Ort» ist ein Tipp weiter.
- Der unsichtbare Titel «New in {v}» der Zeile (nur für Screenreader) heisst jetzt «Neu seit deinem letzten Besuch» und ist sichtbar.

## Selbst entschieden
- «Klappt» / «Klappt nicht» heissen im Text `Works|test` / `Does not work|test`, weil «Geht nicht» schon an anderer Stelle (Mini-Tools) in der App steht und Noah «Klappt nicht» gesagt hat.
- Ist der Knopf «Verbessern» ausgeschaltet (Ich › Darstellung › Bedienung), sagt «Klappt nicht» das in einer Meldung, statt stumm zu bleiben. Browser-Tests starten ohne den Knopf; der Test schaltet ihn ein.
- Das Feld `release` am Logbuch-Eintrag braucht keine neue Dexie-Version (freie Felder), alte Einträge bleiben unverändert (`release: null` nur bei neuen).
- Die Karte zeigt zwei Neuheiten, weil nur die zehn neuesten im Start voll geladen sind (Tempo); ältere Einträge ohne Titel zeigen nur den Rest als «+N weitere».
- Nicht gebaut: Kommentare zu einem Release als eigene Funktion. «Klappt nicht» mit Satz im Logbuch deckt es ab; eigene Kommentare auf Warteliste bis Noah sie will.

## Entscheide (eigene Datei `docs/decisions/testrunde.md`)
- 27.11.2026: Noah «1b 2a 3b 4b 5a» zu Karte, Fenster, Kurztext, ein Paket und PR-Nummer.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Alle Releases in der App»: Teile 2 bis 5 gebaut (Ansicht, Testschritte, Antworten, Logbuch-Link). Offen: Link-Wächter (Teil 4) als eigener kleiner Test, Kommentare.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nach dem nächsten Update Heute öffnen: unter den Chips steht die Karte «Neu seit deinem letzten Besuch» mit zwei Neuheiten.
2. «Klappt» tippen: «Notiert: klappt.» mit Undo, im Logbuch ein Eintrag «Getestet, klappt: …» mit Release.
3. «Klappt nicht» tippen: Fenster von «Verbessern» mit «Fehler» und dem Release; Satz schreiben, speichern.
4. Ich › Was ist neu › «Noch nicht getestet»: Zeile aufklappen, PR und Schritte stehen da; «Unsichtbar» zeigt «Nichts zu testen».
