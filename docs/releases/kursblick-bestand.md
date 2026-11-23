# Kursblick Meine Zahlen: Bestand mit Gewinn, Ziele, Dividenden und Splits, Gold nach Teuerung

PR folgt · 23.11.2026 · Auftrag: Noah «alles davon» (22.11.2026), «ich gebe jetzt ausdrücklich alles frei» (23.11.2026); Welle K-C in einem PR (Koordinator 23.11.2026, frisches Backup von Noah vom 23.11. 04:47)

## Was ist neu
- **Reiter «Meine Zahlen»** (`#/kurse/bestand`, auch in der kleinen App): **Mein Bestand** und **Ziele**, alles nur auf dem Gerät.
- **Mein Bestand (K12):** Posten hinzufügen, ändern, hoch und runter, löschen (mit Rückgängig). Drei Arten: Aktie, Fonds oder Münze (Yahoo-Symbol, Stück), Gold (Gramm, Wert nach dem Börsenpreis vom Vortag) und Wert von Hand («Mein Sparkonto», eine Wohnung, eine Obligation, auch Leitzins-Konten). Pro Posten Einstand (was er gekostet hat, optional) und Kaufdatum (optional). Oben: Gesamtwert, Gewinn oder Verlust in CHF und Prozent, «Mit Dividenden» als Schalter. Preise in Dollar, Euro und Pfund werden mit dem Kurs vom Vortag in Franken umgerechnet (`y:EURCHF=X` und so weiter). Fehlt ein Preis, steht «Gerade kein Preis» und der Posten zählt als «ohne Wert»; nichts wird erfunden.
- **Dividenden und Splits (K14):** pro Posten eintragen (Tag, Betrag in CHF oder Faktor). Ein Split vervielfacht die Stück ab seinem Tag (die Gratisquelle liefert Preise, die schon um Splits bereinigt sind); eine Dividende ist Geld, das du bekommen hast, und zählt mit «Mit Dividenden» zum Gewinn.
- **Ziele (K13):** eine Zahl, auf die du wartest (Gold in CHF pro kg, SMI, ein Titel, Wert von «Mein Bestand»), «bei oder über» oder «bei oder unter». Kursblick prüft sie beim Öffnen und zeigt sie auf **Heute** der kleinen App (erreicht mit Häkchen und Wort, sonst «noch … (… %) entfernt»).
- **Gold nach Teuerung (K15):** im Reiter Gold ein Jahr wählen (Standard: 20 Jahre zurück): die Veränderung seit dann in Franken des jeweiligen Tages und nach Teuerung, dazu die Linie in Franken des gewählten Jahres. Der Preisindex kommt vom Server (`?action=kurse&id=lik`), ein Wert pro Jahr; für die Tage nach dem letzten bekannten Jahr gilt der letzte Wert, und die Seite sagt das («Schätzung»).
- **Hilfe-Zeile und «Gut zu wissen»** für Kursblick (zugesagt in `kursblick-maerkte`).
- Server: `api/_lib/kurse.js` kennt die Reihe `lik` (Weltbank, `FP.CPI.TOTL`, Schweiz, Jahreswerte auf den 1. Juli gelegt); `api/lake.js` unverändert ausser dem Hilfetext.

## Was fällt weg oder rutscht tiefer
- nichts. Der Reiter «Meine Zahlen» steht vor «Quellen»; «Quellen» rutscht damit um eine Stelle nach rechts.

## Selbst entschieden
- **Private Daten in drei Einstellungen** (`kurse.bestand`, `kurse.ziele`, `kurse.mitdividenden`): keine neue Dexie-Tabelle, kein neues Schema, kein neues Backup-Format. Sie kommen in die Sicherungsdatei wie jede Einstellung und in den Abgleich nur verschlüsselt (der Abgleich versiegelt jeden Eintrag mit dem Code, `src/lib/sync/code.js`); zum Kursdienst geht nie etwas davon, er hört nur das Symbol eines Titels. Getestet mit erfundenen Zahlen (`tests/kurse-privat.test.js`) und, einmal, mit einer Kopie von Noahs Backup vom 23.11.2026 (141 MB): Import, Posten dazu, Export, erneuter Import, nichts verloren; die Kopie ist danach gelöscht, nichts davon im Repo.
- **Dividenden und Splits von Hand** statt vom Server: Yahoo liefert Dividenden nicht verlässlich, und eine Schätzung wäre eine Zahl, die niemand prüfen kann. Der Plan sah «sonst eigene Schätzung, klar gekennzeichnet» vor; hier ist es «du trägst sie ein», das ist ehrlicher und ohne `api/`-Änderung.
- **Teuerung von der Weltbank (Jahreswerte)** statt Monatswerte des Bundesamts für Statistik: die Schnittstelle des Bundesamts liess sich im Sandkasten nicht prüfen, die der Weltbank ist stabil und einfach. Die Quelle ist austauschbar (`FETCH` in `api/_lib/kurse.js`); ein BFS-Monatswert-PR kann folgen. Ob der Server «packgen» die Weltbank erreicht, wird nach dem Merge live geprüft (`?action=kurse&id=lik`); bis dahin zeigt die Seite «Der Preisindex ist gerade nicht erreichbar».
- **Nicht gebaut: K16** (Ziele als Mitteilung bei geschlossener App über `api/push.js`). Im Plan «optional»; es braucht eine Erlaubnis und einen täglichen Auftrag auf dem Server, und die Ziele müssten dafür zum Server, was gegen «alles privat» ginge. Ziele zeigen sich beim Öffnen.
- **Nicht gebaut: Gruppen im Bestand.** Die Liste ist flach (Posten lassen sich verschieben); ein Satz Gruppen kann folgen, wenn der Bestand lang wird. Es gibt also keine neue Gruppenart (`GROUP_PLACES` unverändert).
- **Währungen:** Franken, Dollar, Euro, Pfund (und jede andere Währung, die Yahoo als `XXXCHF=X` kennt). Eine unbekannte Währung zeigt «Gerade kein Wechselkurs».
- **Gold im Bestand** zählt zum Börsenpreis; der Händlerabschlag steht im Verkaufsrechner (Reiter Gold).
- Fertig-Regel: Seite (Reiter, Funktionstext erweitert), Absprung (Tab und Zeile auf Heute der kleinen App), «Gut zu wissen» und Hilfe-Zeile (`#/kurse` in `ON_PAGES`), leerer Zustand (Bestand, Ziele), nächster Schritt (Ziele und Bestand zeigen sich auf Heute), App-Stand.
- Keine Anlageberatung; alle Tests mit erfundenen Zahlen.

## Entscheide (für decisions)
- `docs/decisions/kursblick-bestand.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- `docs/vorhaben.md` Punkt 19 «Kursblick»: Welle K-C gebaut (ohne K16). Offen: K16, Monatswerte des Bundesamts, Gruppen im Bestand.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Kursblick › Meine Zahlen › «Zum Bestand hinzufügen»: ein Symbol (z. B. `NESN.SW`), Stück und Einstand, speichern: Wert, Gewinn und Prozent stehen oben.
2. Bei dem Posten «…» › Ändern: eine Dividende (Tag, Betrag) und einen Split eintragen; «Mit Dividenden» ein- und ausschalten und den Gewinn vergleichen.
3. «Ziel hinzufügen»: Gold, «bei oder unter», eine Zahl unter dem heutigen Preis; auf Heute der kleinen App steht das Ziel mit «noch … entfernt».
4. Reiter Gold › «Gold nach Teuerung»: ein Jahr wählen; die zwei Veränderungen und die Linie erscheinen.
