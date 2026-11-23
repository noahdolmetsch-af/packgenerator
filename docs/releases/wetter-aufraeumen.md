# Wetterseite aufräumen

Auftrag: Noah «was fällt dir beim wetter auf?» und «ja» zum Vorschlag in fünf Punkten, 23.11.2026, Thread «Wetter besser machen». Alles freigegeben (Noah 00:03 und 00:05).

## Was ist neu
- **Eine Regen-Startzeit für die ganze Seite.** Vorher stand «ab 07:00» (Tour), «ab 05:00» (Heute), «trocken bis 06:00» (Regen in 3 Std.) und «ab 05:00» (nächste Stunden). Jetzt kommen alle aus einer Quelle (`src/lib/wetter/regenzeit.js`): Open-Meteo stempelt den Regen am Ende der Stunde, die Seite zählt ihn ab dem Anfang; das Fenster der Tour (ab 07:00) schneidet den Regen nicht mehr ab; die ersten 3 Stunden gelten nach dem 15-Minuten-Regen, der Rest des Tages nach den Stunden. Regnet es schon, steht «Regen seit 05:00».
- **Kurzantwort ganz oben** im Reiter «Jetzt»: «Heute: Regen ab 07:00, 3–5 °C. Regenzeug einpacken.» (auch Windjacke, warm anziehen, Wasser).
- **Nebelgrenze** ohne Striche: ohne Hochnebel steht nur die eine Zeile «Keine Nebelgrenze: kein Hochnebel erwartet» statt sechs Strichen und Quellentext.
- **Die nächsten Stunden**: sagen 2, 4, 6 und 8 Stunden dasselbe, steht es einmal («in den nächsten 8 Std.»).
- **Ozon und Pollen** stehen in einer geschlossenen Zeile.
- **Ortsname** «Zürich» statt «Zurich, Canton of Zurich, Switzerland» (gespeichert bleibt der Name, wie er war); «−0» steht als 0 (überall in der App, `num()`); «Nachttemperatur» hat dieselbe Überschriftgrösse wie die anderen Karten.
- **Diagramme mit Achse**: «Regen in den nächsten 24 Stunden» (Balken) und «Zürisee» (Verlauf, gestrichelt die Vorschau) nutzen den Diagramm-Baukasten (`BarChart`, `LineChart`): Achse mit Werten, Zeigen oder Tippen zeigt die Zahl über dem Diagramm, «Als Tabelle» zeigt dieselben Zahlen. Der Baukasten bekam dafür eine kleine Wahl `initial` (welche Spalte vor dem Zeigen gilt).

## Was fällt weg oder rutscht tiefer
- Ozon und Pollen: vorher als eigene Karte offen, jetzt in der geschlossenen Zeile «Ozon und Pollen» (ein Tipp öffnet).
- Nebelgrenze ohne Nebel: die Strichreihe und der Quellentext sind weg (die eine Zeile «Keine Nebelgrenze» und «Nebelgrenze einstellen» bleiben).
- Vier Karten «in 2 / 4 / 6 / 8 Std.», wenn sie gleich sind: eine Karte; sind sie verschieden, bleiben alle vier.
- Die handgezeichneten Balken (Regen 24 Std.) und die kleine Linie (Zürisee) sind durch die Baukasten-Diagramme ersetzt; alle Zahlen stehen weiter da, dazu die Achse.
- sonst nichts.

## Selbst entschieden
- Kein neuer Katalog-Eintrag: das ist Aufräumen bestehender Funktionen; die Kurzantwort steht ohne Absprung an der Spitze der Seite, die schon ihr Ziel ist.
- Der 15-Minuten-Regen wurde um ein Viertel zurückgenommen (Stempel = Ende), der Hintergrundtext des Push-Servers (`api/`) bleibt unverändert.
- Alte Werte im Speicher (15-Minuten-Regen, höchstens 1 Stunde alt) laufen von selbst ab.
- «Zürisee» im Baukasten: die Warnlinie für «angenehm» bleibt als gestrichelte Linie, wenn sie im Bereich der Werte liegt.

## Daten
Keine Daten, kein Schema, kein Backup, kein Sync, kein `api/`.

## Entscheide (eigene Datei `docs/decisions/wetter-aufraeumen.md`)
- 23.11.2026: eine Regen-Startzeit, Stempel am Ende der Stunde.

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter besser machen: nach A bis H jetzt die Aufräumrunde nach Noahs Blick auf die Seite.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Wetter öffnen: ganz oben steht die Kurzantwort mit Regenzeit und Temperatur.
2. Die Regenzeit auf der Tourkarte, in «Heute» und unter «Regen in den nächsten 3 Stunden» vergleichen: dieselbe Zeit.
3. «Radar und Kameras» öffnen, auf einen Balken von «Regen in den nächsten 24 Stunden» zeigen oder tippen: Stunde und Regen stehen über dem Diagramm.
4. In «Jetzt» ganz unten «Ozon und Pollen» antippen: die Werte klappen auf.
