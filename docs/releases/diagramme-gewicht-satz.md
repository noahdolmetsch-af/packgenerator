# Diagramme überall verbessern: Bausteine und Gewicht

PR · 23.11.2026 · Auftrag: Noah «ja» (Thread «Diagramme überall verbessern»)

## Was ist neu
- Gemeinsame Bausteine (`src/lib/charts/LineChart.svelte`, `BarChart.svelte`, `sentence.js`), alles freiwillig, alte Diagramme bleiben wie sie sind: gestrichelte Ziellinie `goal`, Normalband `band`, Satz über dem Diagramm `sentences`, Punkt «heute» `nowAt`. Der Satz für Linien (`changeSentence`) ist eine Regel: «Jetzt …, … mehr/weniger als am …», nie «besser» oder «schlechter».
- Gewicht (`#/me/weight`): beide Kurven sind jetzt Diagramme aus dem Baukasten: Achse mit runden Stufen, Zahlen beim Zeigen, Tipp auf einen Tag oder eine Woche öffnet ein Fenster (beim Gewicht mit «Eintrag ändern» oder «Eintrag für diesen Tag anlegen»), «Als Tabelle», ein Satz darüber.
- FTP über die Monate (Training › Analysen): derselbe Baukasten, Zahlen beim Zeigen, Satz, «Als Tabelle».
- Liste aller Diagramme: `/mnt/project-files/notes/diagramme-2026-11-23/liste.md`; die Liste im Code (`src/lib/charts/rules.js`) wird kürzer.

## Was fällt weg oder rutscht tiefer
- nichts. Die alte, eigene Kurvenzeichnung `src/lib/weight/LineChart.svelte` ist durch den Baukasten ersetzt; die Legende und «Nur deine Einträge. Kein Ziel, keine Bewertung.» bleiben.

## Selbst entschieden
- Beim Gewicht keine Ziellinie und kein Normalband: die Seite sagt bewusst «Kein Ziel, keine Bewertung» (Gesundheitsdaten nur beobachten). Der Satz sagt nur «mehr» und «weniger».
- Die Gewichtskurve hat eine Spalte pro Tag (von der ersten bis zur letzten Eintragung); Tage ohne Eintrag sind Lücken in den Punkten, die Mittel-Linie verbindet die Einträge.
- Ziellinie, Band und «heute»-Punkt sind gebaut, aber noch nirgends eingeschaltet; die nächsten PRs (Aktiv, Heute, Jahresziele) nutzen sie.

## Entscheide (eigene Datei `docs/decisions/diagramme-gewicht-satz.md`)
- 23.11.2026: Diagramm-Vorschläge «ja»; Reihenfolge ein PR pro Seite.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: `weight/LineChart.svelte` ist aus der Liste «offen» (14 offen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Gewicht öffnen: über der Kurve steht ein Satz («Jetzt … kg, … kg weniger als am …»).
2. Auf die Kurve zeigen oder tippen: die Zahlen des Tages stehen darüber; ein Tipp öffnet das Fenster mit «Eintrag ändern».
3. «Als Tabelle» tippen: alle Einträge mit Mittel über 7 Tage.
