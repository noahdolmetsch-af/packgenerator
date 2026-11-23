# Erkenntnisse sagen, wie sicher sie sind

Auftrag: Noah «1a 2b 3a 4a 5a» (21.11.2026), Vorschlag S4 «Erkenntnisse mit Sicherheitsangabe». K3 («Form im Vergleich», «Was auffällt») und «Zusammenhänge nützlicher machen» sind vorher fertig geworden; S4 nutzt deren Baustein `Sicherheit.svelte`.

## Was ist neu
- Jeder Satz unter «Alles, was zusammenhängt» (Auswerten › Körper › Zusammenhänge, und die drei stärksten in der Auswertung) trägt ein kleines Wort: **Sicher**, **Tendenz** oder **Zu wenig Daten**, dasselbe wie bei «Form im Vergleich».
  - Sicher: der Satz hängt deutlich zusammen (Rang ≥ 0.5) und stützt sich auf mindestens 30 Tage.
  - Tendenz: er hängt zusammen, aber weniger deutlich oder auf weniger Tagen.
  - Zu wenig Daten: der «erste Trend» unter «Bald sichtbar» (erst 8 bis 13 Tage).
- Am Seitenende eine geschlossene Zeile «So gerechnet» erklärt die drei Wörter und was die App rechnet.

## Was fällt weg oder rutscht tiefer
- Die Wörter «hängt deutlich zusammen» und «hängt etwas zusammen» unter jedem Satz fallen weg; das Sicherheitswort sagt dasselbe genauer. Die Sätze selbst bleiben gleich.

## Selbst entschieden
- Keine Datenänderung: es wird nur gerechnet und angezeigt, nichts gespeichert.
- Die Zahlen sind fest (30 Tage für «Sicher», bisherige Schwellen sonst), anders als bei K3 gibt es keine Einstellung dafür: die Erkenntnisse haben schon viele Schwellen, noch eine wäre mehr Verwirrung als Nutzen. Kann später dazukommen.
- «So gerechnet» steht ganz unten (Inhalt zuerst), nicht in der kompakten Auswertungs-Ansicht.
- Kein neuer `features.js`-Eintrag (Verfeinerung der Erkenntnisse), ein Satz in `docs/app-stand.md`.

## Entscheide
- Siehe `docs/decisions/erkenntnisse-sicher.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Klügere App: S1, S3, S4, S5, S6 gemacht, S2 gestrichen. Damit ist der Plan «Klügere App» durch.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Körper › Zusammenhänge öffnen: unter jedem Satz steht «Sicher» oder «Tendenz».
2. Ganz unten «So gerechnet» öffnen: die drei Wörter sind erklärt.
