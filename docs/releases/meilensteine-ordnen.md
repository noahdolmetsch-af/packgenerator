# Meilensteine ordnen

Auftrag: Noah «ja» (23.11.2026, mit Bild der Seite; Thread «Meilensteine ordnen und Laufstunden korrigieren»). Ziel: eine App, die im Alltag unterstützt (vorhaben.md, Ziel «Bewegung»).

## Was ist neu
- Auswerten › Meilensteine: ganz oben stehen nur «Dein nächster Stern» (mit der Belohnung als schmaler Zeile) und «Bald erreichbar».
- «Pro Aktivität» ist die eine Liste je Sportart: der echte Name vorne («Velo»), der Spitzname klein danach («Pedal-Glück»), der Sternen-Weg darunter; ein Tipp öffnet die Karten dieser Sportart.
- Jede Zeile eines Sport-Meilensteins beginnt mit der Sportart («Indoor-Velo · Stunden», «Laufen · Stunden»), im Hero, in «Bald erreichbar», im Regal und in der Ganz-geschafft-Kachel. Die Zeile darunter zeigt nur den Spitznamen.
- Ein Block «Geschafft» (rechts am Computer, unten am Handy) vereint Trophäen-Regal, «Ganz geschafft», Rekord-Wand und «Dein Jahr in Sternen».
- Der Block «Alle Meilensteine» heisst jetzt «Über alle Sportarten» und zeigt nur Meilensteine ohne Sportart; die Karten einer Sportart öffnet die Zeile in «Pro Aktivität».
- Filter: «Alle», «Über alle» und die Lieblings-Sportarten sind Chips (echte Namen); alle weiteren Sportarten stehen in einer Auswahl «Weitere Sportarten» (vorher bis zu 18 Chips).
- «So funktionieren Meilensteine» ist zugeklappt und steht am Ende, vor «Zahlen und Stufen ändern».
- «Drei-Ringe-Tag» heisst «Tag im Gleichgewicht» (Bewegen, Achtsam und Erholung an einem Tag): die Ringe der App sind keine Apple-Ringe. Die Sterne bleiben (gleiche Kennung `x.threeRings`).
- Wochen-Meilensteine (Ganze Woche, Wochen in Folge, Sternwochen in Folge) zeigen bei 0 «Diese Woche läuft» statt «0 von 1».

## Was fällt weg oder rutscht tiefer
- Die «Nächstes»-Zeile im Trophäen-Regal fällt weg: die Karte «Dein nächster Stern» ganz oben sagt dasselbe.
- «Ganz geschafft», «Dein Jahr in Sternen» und die Rekord-Wand stehen nicht mehr über den Listen, sondern im Block «Geschafft» weiter unten (am Computer rechts).
- «So funktionieren Meilensteine» steht nicht mehr oben und offen, sondern unten und zu (früher bis zum ersten Zuklappen offen).
- Weitere Sportarten sind nicht mehr einzelne Chips, sondern ein Tipp in der Auswahl «Weitere Sportarten».
- Der Name «Drei-Ringe-Tag» fällt weg (siehe oben); alle Sterne dazu bleiben.

## Selbst entschieden
- Die «49,3 h» und «47,9 h» in Noahs Bild sind keine Rechenfehler: «49,3 h» sind die Laufstunden, «47,9 h» die Stunden des Indoor-Velos; zwei Sportarten haben je einen Meilenstein «Stunden». Verwechselt wurde es, weil die Sportart nur klein hinter dem Stern stand. Die Zahlen und Prozente (99 % / 96 %) stimmen und kommen aus derselben Rechnung; die Sportart steht jetzt vorne.
- Die Belohnung bleibt als schmale Zeile unter der Karte «Dein nächster Stern» (Noah 21.11.2026 «5a»), auch wenn «oben nur Stern und Bald erreichbar» steht: sie gehört zum nächsten Stern.
- «Karten einer Sportart» liegen hinter dem Tipp auf die Zeile in «Pro Aktivität» (vorher auf dem Handy hinter «Alle n zeigen» und am Computer in «Alle Meilensteine», nur für Meilensteine ohne Sportart); so steht nichts doppelt.
- «Tag im Gleichgewicht» statt «Drei-Ringe-Tag»; ein eigener Fitbit-Meilenstein (z. B. Zonenminuten) besteht schon unter «Fitbit».
- Kein Datenumbau, darum kein Backup-Test; nur Anzeige.

## Entscheide (für decisions.md)
- Siehe `docs/decisions/meilensteine-ordnen.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Meilensteine: oben nur die Karte «Dein nächster Stern» und «Bald erreichbar»; jede Zeile beginnt mit der Sportart.
2. «Pro Aktivität»: echter Name, Spitzname klein, Sternen-Weg; ein Tipp öffnet die Karten der Sportart.
3. Am Seitenende (Computer: rechts) steht ein Block «Geschafft» mit Regal, Ganz geschafft, Rekord-Wand und Jahr.
