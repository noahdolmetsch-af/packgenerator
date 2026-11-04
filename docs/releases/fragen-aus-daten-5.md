# Fragen aus deinen Daten, Stufe 2, Schritt 2: Pause vom Training

PR #758 · 04.11.2026 · Auftrag: Noah «bau Stufe 2», «ok 758» (Thread «Bauen: Tagescheck Stufe 2»)

## Was ist neu
- Fünfte Regel **«Pause vom Training»**: Ist das letzte erfasste Training (Strava-Aktivität oder ein Tennisspiel oder eine Tennisstunde) 4 Tage her oder mehr, fragt der Morgen-Check «Was hat dich zuletzt vom Training abgehalten?» (Keine Zeit, Müde, Wetter, Pause gewollt, Unterwegs, Nichts Besonderes, plus Satz) und sagt, wie lange das letzte Training her ist.
- Wie die anderen Regeln: Schalter, Schwelle (2 bis 14 Tage), eigene Worte, «Zurück zum Standard». Zählt in die höchstens 3 Datenfragen pro Tag.
- Gibt es noch keine Strava-Aktivitäten, steht im Kasten, warum die Training-Regeln still sind, mit Link zu Ich › Verbindungen.

## Was fällt weg oder rutscht tiefer
- nichts. (Die Regel «Nach einem langen Tag unterwegs» aus der ersten Fassung dieses PRs entfällt, weil #770 «Langer Tag gestern» schon liefert.)

## Selbst entschieden
- Ohne ein einziges Training in den letzten 40 Tagen bleibt die Regel still, weil sich dann nichts zählen lässt (zum Beispiel ohne Strava).
- Tennis zählt als Training (gespielt oder Stunde gegeben), andere Sport-Einträge nicht.
- Die App liest dafür die Strava-Aktivitäten und Sport-Einträge der letzten 40 Tage (vorher nur gestern). Kein Schema- oder Backup-Format geändert.
- Fertig-Regel: wie bei den anderen Regeln. Katalog und «Gut zu wissen» nennen die Regeln allgemein; leerer Zustand: Hinweis im Kasten.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan
- «Fragen aus deinen Daten», Stufe 2: Training fertig (Langer Tag #770, Pause hier). Weiter: Tennis, Wiederholungsschutz, Wetter, Zufallsfrage, Vermutungen testen (Reihenfolge nach Noah «5a» vom 04.11.), je ein PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Deine Abfragen: im Kasten «Fragen aus deinen Daten» steht die fünfte Regel «Pause vom Training».
2. Die Tage auf 2 stellen oder die Regel aus- und einschalten.
3. Nach ein paar Tagen ohne Training fragt der nächste Morgen-Check, was dich abgehalten hat, mit «Warum frage ich das?».
