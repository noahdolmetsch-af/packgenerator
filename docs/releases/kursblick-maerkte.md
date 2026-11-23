# Kursblick Märkte: Aktien, Fonds, Krypto, Metalle, Währungen und der Vergleich

PR folgt · 23.11.2026 · Auftrag: Noah «alles davon» (22.11.2026), «ich gebe jetzt ausdrücklich alles frei» (23.11.2026); Welle K-B in einem PR (Koordinator 23.11.2026)

## Was ist neu
- **Reiter «Märkte»** (`#/kurse/maerkte`, auch in der kleinen App): fünf Gruppen mit Vorschlägen: Aktien (sieben Schweizer), Fonds und ETF (iShares SMI und SPI, Vanguard All-World, iShares World), Krypto (Bitcoin, Ethereum), Metalle und Rohstoffe (Silber, Platin, Palladium, Kupfer, Öl, Kaffee, Kakao, Uran- und Goldminen-ETF), Geld und Währung (Euro, Dollar, Pfund in Franken). Jede Zeile: Schlusskurs vom Vortag, Tag, Veränderung über den gewählten Zeitraum (wie bei Gold).
- **«Titel hinzufügen»** für jede Art: Name, Symbol (wie Yahoo es schreibt, z. B. NESN.SW, BTC-USD, ^SSMI), Art, Gruppe. Vor dem Speichern fragt die App den Server einmal, ob er Kurse dafür kennt; ein Tippfehler zeigt sich sofort, «Trotzdem speichern» geht auch.
- **Gruppen und Titel änderbar:** neue Gruppe, umbenennen, löschen (die Titel gehen in eine andere Gruppe oder «Ohne Gruppe»), Titel ändern, hoch und runter, löschen. Alles mit Rückgängig; «Vorschläge zurückholen».
- **Vergleich:** bis zu fünf Titel ankreuzen, eine Grafik, alle beginnen am selben Tag bei 100. Jede Linie hat ihren eigenen Strich; unter der Grafik steht pro Linie Name und Veränderung, mit «Daten seit …», wenn ein Titel später beginnt.
- **Diagramm besser** (Noah 23.11.2026 «das Diagramm muss besser werden, mit Mouseover für Werte»): Gold, SMI und Vergleich nutzen jetzt den Linien-Baukasten der App (`src/lib/charts/LineChart.svelte`): Wertachse mit runden Schritten und Gitterlinien, drei Daten unter der Linie, Tag und Preis über der Linie beim Darüberfahren (Maus) oder Antippen und Wischen (Handy), «Als Tabelle» für dieselben Zahlen. Beim Vergleich zeigt die Zeile alle Linien mit ihrem Wert. Die Linie zeigt genau den gewählten Zeitraum: «Woche» zeigt eine Woche (vorher mindestens einen Monat). Der Baukasten bekam nur ein kleines Feld `dash` pro Linie, damit die Striche zur Legende passen.
- Server: `api/lake.js` `?action=kurse&id=y:SYMBOL` (`api/_lib/kurse.js`): eigene Titel nur über Yahoo, das Symbol wird streng geprüft; Währung und Name kommen mit der Antwort. Futures (`=F`) und Währungen (`=X`) bekommen die Tagesregel wie Gold (der Balken zählt für den Tag, an dem er endet).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- **Eine Maschine statt fünf Bauten** (K6 bis K10): die Arten unterscheiden sich nur durch Symbol, Gruppe und Vorschlag.
- **Nicht gebaut, weil es bei Yahoo kein Symbol gibt:** Rhodium, Leitzins und SARON, Sparkonto von Hand, Säule-3a-Fonds, Obligationen und Immobilien-Fonds ohne Börsenkürzel. Wer ein Symbol kennt, fügt es selbst hinzu; Werte von Hand kommen mit Welle K-C («Mein Bestand»).
- **Krypto-Verlauf:** Yahoo liefert Bitcoin und Ethereum seit etwa 2014; eine zweite Quelle für den längeren Verlauf ist nicht gebaut.
- **Die Vorschläge sind Symbole nach bestem Wissen;** der Sandkasten erreicht Yahoo nicht, geprüft wurde auf der Vorschau des PRs. Falsche Symbole zeigen «Gerade keine Kurse» und lassen sich in der App ändern.
- Keine Datenbank-, Backup- oder Schemaänderung: die Liste ist eine Einstellung (`kurse.maerkte`, im Backup wie jede Einstellung).
- Fertig-Regel: Seite (Funktionstext erweitert), Absprung (Ich-Seite und Reiter), leerer Zustand («Noch nichts verfolgt» mit «Titel hinzufügen»), nächster Schritt (Vergleich unter der Liste). «Gut zu wissen» und «Was du hier tun kannst» für die kleine App folgen mit K-C.
- Keine Anlageberatung; Tests nutzen erfundene Reihen.

## Entscheide (für decisions)
- `docs/decisions/kursblick-maerkte.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- `docs/vorhaben.md` Punkt 19 «Kursblick»: Welle K-B gebaut. Folgt: K-C Persönliches.

## Prüfschritte (nach dem Merge auf der echten Seite)
0. Kursblick › Heute › «Woche» antippen: die Linie zeigt eine Woche; mit der Maus darüberfahren (Handy: antippen): Tag und Preis stehen darüber.
1. Kursblick › Märkte: die Zeilen zeigen Preis und Veränderung; bei einer Zeile mit «Gerade keine Kurse» das Symbol über «Ändern» korrigieren.
2. «Titel hinzufügen»: XRP-USD, Art Krypto: die Münze erscheint mit Preis.
3. Zwei bis fünf Titel ankreuzen: die Vergleichsgrafik zeigt alle Linien ab 100.
4. Eine Gruppe umbenennen, löschen, «Rückgängig» antippen.
