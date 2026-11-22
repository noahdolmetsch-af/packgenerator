# Ringe und Wochenziele führen weiter (Aktiv)

PR #… · 07.11.2026 · Auftrag: Noah «alle Vorschläge» der UI-Prüfung, Rang 3 (A1), Frage «5a» (Thread «Absprünge: Analyse und Aktiv antippbar machen»)

## Was ist neu
- Aktiv › «Ringe»: jede Zeile (Bewegen, Achtsam, Erholung) ist antippbar. Hat der Ring genau eine Sportart, öffnet sie deren Wert in der Analyse (7 Tage). Hat er mehrere, öffnet sie «Haken ausgewertet».
- Aktiv › «Meine Wochenziele»: jedes Ziel öffnet seinen Wert in der Analyse (Woche); das Kilometerziel öffnet die Velo-Kilometer.
- Kein neuer Baustein: `numHref` aus «Zahl mit Weg», dazu `src/lib/flow/ringweg.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeilen sehen gleich aus, mit einem kleinen Pfeil rechts und mindestens 44 px hoch.

## Selbst entschieden
- Ein Ring ist eine Sammlung von Sportarten und hat keinen eigenen Wert in der Analyse. Darum: eine Sportart → ihr Wert, mehrere → «Haken ausgewertet» (`#/flow/auswertung`).
- Das Kilometerziel zählt Velo-Fahrten; es führt darum auf «Velo-km» der Analyse (`km:bike`), nicht auf «Distanz» (alle Sportarten).
- Die kleinen Ringe auf Heute bleiben unverändert (Heute wird von anderen PRs umgebaut).
- Keine neue Funktion in `features.js`: Wege auf bestehenden Seiten.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: Rang 3 (A1): Aktiv gebaut (Noah «5a»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv öffnen, unter «Ringe» auf «Achtsam» tippen: die Seite dieses Werts in der Analyse öffnet sich.
2. Zurück, auf «Bewegen» tippen: hat der Ring mehrere Sportarten, öffnet «Haken ausgewertet».
3. Bei «Meine Wochenziele» ein Ziel antippen (zum Beispiel «Velo-km»): sein Verlauf in der Analyse öffnet sich, für die Woche.
