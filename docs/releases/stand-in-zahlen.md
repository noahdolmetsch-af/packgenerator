# Dein Stand in Zahlen (Velos und Material, das Muster)

PR #1728 · 24.11.2026 · Auftrag: Noah «b» (Thread «Mini-Landingpage pro Bereich bauen»)

## Was ist neu
- Oben auf Velos und Material steht die Karte «Dein Stand in Zahlen»: drei grosse Zahlen (Kilometer im laufenden Monat, was in der Pflege fällig ist, Tage seit der letzten Fahrt). Jede führt dorthin, woher sie kommt (Fahrten-Buch, Pflege, Fahrten).
- Darunter «Kilometer pro Monat, die letzten 12 Monate» auf dem gemeinsamen Balkendiagramm (Antippen zeigt den Monat, «Als Tabelle»). Am Computer steht es neben den Zahlen und ist offen, am Handy ist es eine geschlossene Zeile, damit die Velos gleich darunter sichtbar bleiben.
- «Ausblenden» schaltet die Karte aus (mit Rückgängig). Der Schalter «Dein Stand in Zahlen» steht unter Ich › Darstellung › Bedienung.
- Ohne Fahrt in den letzten 12 Monaten fehlt das Diagramm; ein Satz sagt, wie man Fahrten bekommt.
- Muster für alle Bereiche: `src/lib/ui/StandZahlen.svelte` ist für jeden Bereich gleich. Ein Bereich bringt nur seinen Rechenteil (`src/lib/stand/<bereich>.js`, rein, mit Test) und eine kleine Hülle (`StandVelos.svelte`), die Daten liest und die Zahlen benennt.

## Was fällt weg oder rutscht tiefer
- Die Velo-Karten auf Velos und Material rutschen um die Höhe der Karte nach unten (am Handy etwa 190 px, am Computer etwa 280 px). Nichts fällt weg.

## Selbst entschieden
- **Bereich Velos und Material als Muster:** reichste Daten (Fahrten seit 2023, Pflege, Kilometer), passt zu «Velo im Griff» aus dem Leitfaden, und die Seite hat oben noch keine Zahlen (die Tour-Seite und Auswerten werden gerade von anderen Threads umgebaut).
- **Zahlen aus denselben Quellen wie Heute:** Monatskilometer und 12 Monate wie «Velo im Monat» und «Letzte 12 Monate» auf Heute (`withStravaRides`), «fällig» wie die Karten darunter (`dueCards`). So widersprechen sich zwei Stellen nie.
- **Inhalt zuerst:** Die Karte ist Inhalt, keine Hilfe, sie steht nach den beiden geschlossenen Hilfezeilen und vor den Velos. Am Handy ist der Verlauf eine geschlossene Zeile.
- **Ein globaler Schalter** statt einem pro Bereich: «Ausblenden» auf einem Bereich gilt für alle gleich; Rückgängig und der Schalter in Bedienung holen sie zurück. Nur auf diesem Gerät (wie alle Schalter in Bedienung), keine Daten, kein Backup berührt.
- «Fällig» ist grau-braun (Warnfarbe), nie rot: ein Hinweis, kein Alarm.
- Kein Eintrag in `features.js`: ein Baustein, keine eigene Seite. Er bekommt einen, wenn er auf mehreren Bereichen steht. Absprung: jede Zahl ist selbst einer.
- Zahlenstil und Farbe pro Bereich (#1716) sind online: die Karte nutzt dieselbe Zahlengrösse und -schrift wie `Stat` (`--fs-num`) und folgt der Farbe des Bereichs (Velos und Material blau). Den Baustein `Stat` selbst nutzt sie nicht, weil die Beschriftung einer Zahl hier den Weg-Pfeil trägt.

## Entscheide (eigene Datei `docs/decisions/stand-in-zahlen.md`)
- 24.11.2026: Idee «b» (Dein Stand in Zahlen) für alle Bereiche, erst als Muster auf einem Bereich.

## Stand im Plan (roadmap.md / vorhaben.md)
- Mini-Landingpage pro Bereich: Muster auf Velos und Material; die anderen Bereiche folgen einzeln.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos und Material öffnen: oben drei Zahlen, direkt darunter die Velo-Karten.
2. Eine Zahl antippen: sie führt zum Fahrten-Buch, zur Pflege oder zu den Fahrten.
3. Am Handy die Zeile «Kilometer pro Monat» antippen: das Diagramm klappt auf; einen Balken antippen.
4. «Ausblenden» tippen, dann «Rückgängig». Danach unter Ich › Darstellung › Bedienung den Schalter «Dein Stand in Zahlen» ausprobieren.
