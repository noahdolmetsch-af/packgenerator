# Form-Verlauf zum Antippen

PR #<nummer> · 28.10.2026 · Auftrag: Noah «1-5 a» (Thread «Diagramme klickbar machen»), PR 2 von 8 (K1)

## Was ist neu
- «Form und Erholung» › Verlauf (`src/lib/flow/form/FormVerlauf.svelte`): Fitness und Müdigkeit, Form und Ruhepuls je mit eigener Achse (runde Stufen, Gitterlinien), der letzte Wert am Ende jeder Linie, der höchste markiert, mindestens drei Daten unten.
- Zeigen: die vier Werte des Tages in der Zeile darüber, ein Strich durch alle Teile. Tippen oder Enter: der Tag als Fenster (Werte, Belastung, Aktivitäten, Ruhepuls gegen dein Normal), «Tag davor» / «Nächster Tag».
- Am Diagramm (Frage 3 «a»): Zeitraum 4 Wo, 12 Wo, 6 Mon, 1 J und jede Linie ein- und ausschaltbar. «Als Tabelle» zeigt die Tage als Zeilen.
- Beim Ruhepuls zeigt ein Streifen dein Normal (mittlere Hälfte der 30 Tage vor heute); Lücken bleiben Lücken.

## Was fällt weg oder rutscht tiefer
- Die Legende mit den heutigen Zahlen wird zu Schaltern mit denselben Zahlen (alter Weg: Legende über dem Diagramm → neuer Weg: Schalter über dem Diagramm).
- Der Abschnitt heisst «Verlauf» statt «12 Wochen», weil der Zeitraum jetzt wählbar ist (12 Wochen bleibt die Vorgabe).

## Selbst entschieden
- Touren als Band im Verlauf kommen mit der neuen Tour-Bereitschaft (K4).
- «In Analyse öffnen» kommt, sobald die Analyse online ist.
- Der höchste Wert wird bei der Müdigkeit markiert (sonst bei der Fitness, wenn Müdigkeit aus ist).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 2 von 8. Danach Was heute zählt (K3), Tour-Bereitschaft (K4), Training, Körperwerte, Aktiv, Heute-Kacheln, Rückblick/Unterwegs/Rennen/Ski.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Form und Erholung, im «Verlauf» auf einen Tag zeigen: die Zeile darüber zeigt Fitness, Müdigkeit, Form, Ruhepuls.
2. Den Tag antippen: das Fenster zeigt Werte und Aktivitäten; «Nächster Tag» blättert.
3. «6 Mon» und «Ruhepuls» tippen: ein halbes Jahr, ohne Ruhepuls.
