# Auswerten-Übersicht: Tagesantwort zuerst

PR #? · 24.11.2026 · Auftrag: Noah «1-5a» (Impeccable ganze App, 07:37 UTC) und «ja» (08:33 UTC), Paket 5, Punkte F1 und F2

## Was ist neu
- Auf `#/auswerten` steht die Karte «Bereitschaft» **direkt unter dem Titel**. Reihenfolge: Kopf, Bereitschaft, «Aktivitäten von heute» und «Im Fokus», die Zeile «Zeitraum», «Überblick und letzte 7 Tage», «Wi gaht's?», Kacheln.
- Der Zeitraum ist **eine Zeile** «Zeitraum: Woche · 12. Okt. – 18. Okt. 2026» mit «Ändern» (`src/lib/flow/PeriodLine.svelte`). Ein Tipp klappt den bekannten Schalter (Woche, Monat, Jahr, Alles, eigener Zeitraum, ‹ ›) an dieser Stelle auf. Die Wahl bleibt gespeichert wie bisher. Das Sportjahr behält seinen eigenen Schalter.
- **Tagesvorschlag** unter der Antwort (`src/lib/flow/form/TagesVorschlag.svelte`), auf der Karte in Auswerten und auf der Seite «Form und Erholung»: Ruhe → «Heute erholen?» mit «Erholung abhaken» (`#/flow/rest`); locker → «Lust auf eine lockere Runde?» mit «Ausflugstipps» (`#/trips/dreams`); normal → «Was heute im Plan steht» mit «Wochenplan» (`#/flow/wochenplan`); bereit → «Heute geht's gut. Welcher Berg ruft?» mit «Ausflugstipps». Die Zeile steht ausserhalb des Links der Karte und lässt sich mit «Leistungstipps» abschalten (`suggest.on.performance`).

## Was fällt weg oder rutscht tiefer
- Der aufgeklappte Zeitraum-Schalter stand ganz oben unter dem Titel; er steht jetzt als geschlossene Zeile über «Überblick und letzte 7 Tage». Alt: sofort sichtbar. Neu: ein Tipp auf «Ändern».
- Der Satz «Der Zeitraum gilt für die Liste darunter …» steht nicht mehr auf der Seite, sondern im «?»-Fenster («Gut zu wissen», `src/lib/wissen/koerper.js`).

## Selbst entschieden
- Die Zeile «Zeitraum» steht im Überblick selbst (auf dem Computer über «Überblick», am Handy über der Zeile «Überblick und letzte 7 Tage»), weil der Überblick eine eigene Komponente ist; der Überblick bekommt sie als Teil mitgegeben (`lead`).
- Die Stufen der App heissen «Ruhe, locker, normal, bereit» (`rest, easy, normal, hard`); «bereit» bekommt den Berg-Satz.
- Die Seite «Form und Erholung» zeigt dieselbe Zeile unter der Antwort; sie ist zugleich der nächste Schritt dieser Seite.
- Fertig-Regel: Seite (nichts Neues, Funktion `f.overview` besteht), Absprung (die Zeile selbst), Gut zu wissen (angepasst), leerer Zustand (ohne Bereitschaft fehlt die Zeile, die Karte sagt warum), App-Stand (Zeile Auswerten angepasst).

## Entscheide
- 24.11.2026 «1-5a»: Tagesantwort zuerst, Zeitraum in einer Zeile, Tagesvorschlag (`docs/decisions/auswerten-uebersicht.md`).

## Stand im Plan
- Impeccable ganze App, `auswerten.md`: F1 und F2 erledigt. Offen: F3 bis F6 (eigene PRs).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten öffnen: unter dem Titel steht die Karte «Bereitschaft», danach «Im Fokus» und die Zeile «Zeitraum: Woche · …».
2. «Ändern» tippen: der Schalter klappt auf; «Monat» wählen, die Zeile nennt den Monat.
3. Unter der Antwort den Link tippen (zum Beispiel «Wochenplan»): die Seite öffnet sich.
4. Ich › Darstellung › Vorschläge: «Leistungstipps» ausschalten, die Zeile fehlt.
