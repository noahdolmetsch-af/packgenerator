# Was die Woche wirklich hält

PR #1783 · 24.11.2026 · Auftrag: Noah «4a» (Thread «Wochenplan-Vorschläge verlässlich machen»), Schritt 5 von 6

## Was ist neu
- Training › Woche: die Zeile bei den Wochenpfeilen («geplant 19:20 von 15:00 Std.») zählt jetzt alles: eigene Einheiten, TrainingPeaks, die Vorschläge des Wochenplans und die Termine des Teams. Das Ziel ist das des Wochenplans; in einer Woche mit TrainingPeaks oder Teamterminen das eigene Ziel dafür (Schritt 3), sonst das Ziel pro Woche. Ohne Wochenplan zählt wie bisher «Meine Wochenziele».
- Wochenplan › Einheiten pro Woche: unter dem Namen jeder Sportart steht «Diese Woche 2 von 3», wie viele Einheiten die Woche wirklich hält. TrainingPeaks, Teamtermine und das Stundenziel können welche wegnehmen. Eishockey mit Spielerplus: «Diese Woche 1 aus dem Spielplan».

## Warum
Befund vom 23.11.2026: «geplant 7:23 Std.» zählte die Vorschläge nicht mit, die Zahl passte nie zum Ziel; und niemand sah, warum eine Sportart in der Woche weniger vorkam als im Ziel.

## Was fällt weg oder rutscht tiefer
nichts. Die Zeile stand schon da, sie zählt nur mehr. Kein neuer Block über dem Inhalt.

## Selbst entschieden
- «Plus und Minus» je Sportart: die bestehenden Knöpfe ändern die Zahl für jede Woche (das Soll); eine Zahl nur für diese eine Woche ist nicht gebaut. Dafür gibt es «Verschieben», «Loslassen» und die Wochen-Art. Falls du eine Zahl nur für diese Woche willst, sag es.
- Kein Schema, kein `api/`, nur Anzeige.

## Entscheide (eigene Datei `docs/decisions/woche-zahlen.md`)
- 23.11.2026: Soll-Zeile und «diese Woche a von b» (Noah «4a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Wochenplan-Vorschläge verlässlich machen»: Schritt 5 von 6.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Woche: bei den Wochenpfeilen steht «geplant … von … Std.»; die Zahl passt zu dem, was die Tage zeigen (mit gestrichelten Vorschlägen).
2. Training › Wochenplan › Einheiten pro Woche: unter jeder Sportart steht «Diese Woche a von b».
