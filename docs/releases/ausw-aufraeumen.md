# Auswerten: Zeiträume klarer

PR folgt · 07.11.2026 · Auftrag: Noah «1b 2a 3a 4a 5a» (Thread «Entwerfen: Auswerten-Übersicht aufgeräumt»), Teil 1 von 3

## Was ist neu
- «Im Fokus» zeigt nur Sportarten mit einer Aktivität in den letzten 7 Tagen. Vorher wählte es die Sportarten der letzten 28 Tage und zeigte dann 0:00:00 mit leerem Diagramm. Gab es in 7 Tagen nichts, steht eine Zeile: «In den letzten 7 Tagen keine Aktivität. Die letzte: Velo, Di 28. Okt.» mit Link.
- Die Kacheln der Übersicht nennen ihren Zeitraum: Kalorien immer mit dem Tag («heute», «gestern» oder Wochentag), Ruhepuls mit dem Tag, wenn es nicht heute ist, Aktivzonen mit «seit Montag» und den Tagen (die Kachel zählt die Kalenderwoche für das Wochenziel).

## Was fällt weg oder rutscht tiefer
- «Im Fokus» für Sportarten ohne Aktivität in den letzten 7 Tagen (statt einer Karte mit 0:00:00 eine Zeile).

## Selbst entschieden
- Die Kacheln und «Deine Woche in Zahlen» bleiben getrennt (Noahs «1b»); nur der Zeitraum steht jetzt dabei.
- Das Wochenziel bleibt Montag bis Sonntag (Noahs «2a»).
- Die Zeile «keine Aktivität» erscheint nur, wenn es überhaupt eine frühere Aktivität gibt.

## Entscheide (für decisions.md)
- keine neuen (Noahs Antworten 07.11.: 1b 2a 3a 4a 5a stehen im Thread; Teil 2 und 3 folgen als eigene PRs)

## Stand im Plan (roadmap.md / vorhaben.md)
- «Auswerten aufräumen»: Teil 1 gebaut; Teil 2 (Link-Karten weg, Gipfelbuch als Tab) und Teil 3 (Abhak-Liste nach Aktiv, Fragen-Erklärung eingeklappt) folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Übersicht: unter «Kalorien» steht der Tag («gestern» o. ä.).
2. Die Kachel «Aktivzonenminuten» sagt «seit Montag · 2.–7. Nov.».
3. Ohne Fahrt in den letzten 7 Tagen zeigt «Im Fokus» eine Zeile mit dem Tag der letzten Aktivität.
