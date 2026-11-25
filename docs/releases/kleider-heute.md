# Kleider «heute»: Vorschlag bei Kälte, Aufräumen nach Vorschlag

PR #1783 · 23.11.2026 · Auftrag: Noah «ja» (Befund des Koordinators zu seinem Bild vom Kleiderschrank)

Bilder: /mnt/project-files/bilder/kleider-heute/

## Was ist neu
- Der Vorschlag «Was ziehe ich heute an?» (und die Anprobe) wählt bei Kälte (gefühlt unter 15 °C) nur Teile mit Temperaturbereich oder Klasse; ein Teil mit 2 °C Luft zur unteren Grenze geht vor einem am Rand. Ein Teil ohne Angabe (z. B. «ultradünn, warme Fahrten», Brillen-Etui) wird nicht mehr geraten: es steht eine Lücke mit Grund da.
- «Aufräumen» unter «Noch einordnen» (eine geschlossene Zeile mit der Zahl): Teile ohne Temperaturbereich mit Vorschlag zum Antippen, Teile die nach Alltag aussehen (Badehose, Flip-Flops, Schlafhose …) mit «Alltag» oder «Bleibt fürs Velo», und Doppelte zum Zusammenlegen. Jeder Tipp hat «Rückgängig».
- Wunschliste-Teile stehen abgesetzt unter den Spalten und zählen nicht in Zwiebel, Gewicht und Vorschlag.
- Ein Gewicht unter 5 g oder genau ganze Kilogramm trägt «prüfen?».
- «Was ziehe ich heute an?» steht nur noch einmal (der Knopf oben); der Sprung «Auf dieser Seite» dafür ist weg.

## Was fällt weg oder rutscht tiefer
- Der Sprung «Was ziehe ich heute an?» in «Auf dieser Seite» (derselbe Weg wie der Knopf oben).
- Wunschliste-Teile stehen nicht mehr zwischen den Kleidern, sondern in einer eigenen Liste unter den Schichten (sie rutschen tiefer, nichts fällt weg).

## Selbst entschieden
- Die Regenjacke ist die Ausnahme: bei Regen nimmt der Vorschlag auch eine ohne Angabe, wenn keine mit Bereich da ist (sie hält den Regen ab, die Wärme kommt aus den Schichten darunter).
- «Kälte» heisst gefühlt unter 15 °C; darüber wird wie bisher gewählt (ein Regenjackenteil ohne Angabe bei 20 °C und Regen zählt weiter).
- «Bleibt fürs Velo» merkt sich das Gerät (nicht die Daten), damit kein Datenfeld dazukommt.
- Doppelte: «Zusammenführen» legt das zweite Teil (nach Id) in das erste, mit dem bestehenden Zusammenlegen (archiviert, nicht gelöscht, mit Rückgängig).
- Kein Schema, kein Backup-Format, kein Sync, kein api/. Die Tipps schreiben nur Felder, die es schon gibt (Bereich, Bereiche, Zusammenlegen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Kleiderschrank öffnen: die dunkle Karte «Heute» zeigt bei Kälte und Regen Teile mit Bereich oder eine Lücke.
2. «Aufräumen» öffnen, bei einem Teil den vorgeschlagenen Bereich tippen, dann «Rückgängig».
3. Unter den Schichten: «Wunschliste» ist eine eigene Liste; ein Teil mit 1 g zeigt «prüfen?».
