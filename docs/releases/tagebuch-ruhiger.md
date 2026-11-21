# Ein ruhigeres Tagebuch

PR folgt · 21.11.2026 · Auftrag: Noah «1-5a» (Thread «Einheitliches Erscheinungsbild, Tagebuch zuerst»; Bericht https://claude.ai/artifact/7vM8VacJjgKav8pEz2484z)

Stufe 2 der Seitenregeln, das Tagebuch als erster Fall (Noah 5a: erst die Werte, dann das Tagebuch, dann Ort für Ort).

## Was ist neu
- «Neuer Eintrag», «Eintrag diktieren», «Sprachnotiz» und die Vorlagen stehen zusammen in einer Karte (Antwort 3a: die Frage des Tages bleibt eine eigene Karte darunter). Am Handy ist «Neuer Eintrag» der volle Knopf, die zwei anderen stehen nebeneinander, die Vorlagen und die Filter-Chips laufen in einer Zeile seitlich.
- Der Satz «Du hast n Einträge geschrieben.» steht direkt unter dem Titel, nicht mehr fett (`.tb-sentence`).
- Die vier Ansichten (`Seg`) füllen die Zeile und brechen am Handy nicht mehr in zwei Zeilen um. Das gewählte Feld ist schon die weisse Fläche mit Rand (Antwort 4a: Aktiv und Auswerten sind Sache der Orte-Leiste im Thread «Ganze App neu denken»).
- Ecken im Tagebuch: Karten und Fenster mit `--radius-card`, kleine Kacheln und Bilder mit `--r-ctl`.
- Neu in `src/lib/seiteninhalt.js`: `LINE_OFF` (Seiten ohne die Zeile; zuerst nur das Tagebuch). Die weiteren Seiten kommen mit dem Seiten-Baustein.

## Was fällt weg oder rutscht tiefer
- Die Zeile «Was du hier tun kannst» unter dem Titel fällt weg (Antwort 2a). Der Inhalt (Funktionen, «Gut zu wissen», «So geht's») steht unverändert im Fenster hinter dem «?» oben.
- Die kleine Zeile «So geht's» (AreaIntro) steht nur noch beim ersten Besuch offen und bleibt danach weg (`quiet`); ihre Tipps stehen im «?».
- Die Frage des Tages rutscht unter die Schreib-Karte; die Vorlagen stehen leise unter den Knöpfen statt als eigene Zeile.
- Eigener Brotkrumen-Pfad der Listen-Ansicht ist weg (die Orte-Leiste zeigt ihn schon).

## Selbst entschieden
- Die Zeile wird mit der Liste `LINE_OFF` ausgeschaltet, nicht mit Stil: die Seite behält ihre Funktionen im «?». Die Tests `inhalt.spec.js` (öffnet das «?» auf dieser Seite) und `seiteninhalt.spec.js` (Zeile steht hinter dem Titel; Tagebuch nicht mehr in der Liste) sind mit Absicht angepasst, nichts gelockert; neu `tests/seiteninhalt.test.js`: jede Seite in `LINE_OFF` hat noch Inhalt.
- Der Umschalter am Handy bricht nicht mehr um, weil `Seg` die ganze Zeile nutzt (`full`) statt `full={false}`.
- Die Ecke der Heute-Begrüssung, der Orte-Leiste und der Umschalter Aktiv/Auswerten bleiben beim anderen Thread.

## Entscheide (für decisions.md)
- keine neuen (siehe Eintrag vom 21.11.2026 «Seitenregeln für die ganze App»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Erscheinungsbild: Stufe 2, Tagebuch gebaut. Gehört zu Ziel «Eine App, die mich im Alltag unterstützt».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Notizen › Tagebuch: oben eine Karte mit den drei Knöpfen und den Vorlagen.
2. Oben auf das «?»: die Hilfe des Tagebuchs öffnet sich mit «Was du hier tun kannst».
3. Handy: die vier Ansichten stehen in einer Zeile, nichts scrollt seitlich.
