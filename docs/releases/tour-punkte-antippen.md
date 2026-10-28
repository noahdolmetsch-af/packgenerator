# Punkte auf der Tour-Seite antippen

28.10.2026 · Auftrag: Noah «Diagramme sollen genaue Werte zeigen … und überall sonst» (Thread «Tour-Detailseite übersichtlicher machen»)

## Was ist neu
- Ruhepuls-Punkte unter «Werte»: Eine Zeile über den Punkten zeigt Tag, Ruhepuls und NP (oder Ø Puls). Am Anfang steht dort diese Tour.
- Zeigen oder mit den Pfeiltasten wählen wechselt den Punkt. Ein Tipp öffnet ein Fenster mit den Zahlen, «‹ Punkt links» / «Punkt rechts ›» und «Diese Fahrt öffnen».
- Bei bis zu 12 Punkten steht die Zahl am Punkt. Die Achse links hat die Einheit (W oder S/min) oben.
- «Als Tabelle» zeigt alle Punkte als Zeilen, neueste zuerst.
- `TourAnalysis.svelte` steht jetzt in `src/lib/charts/rules.js` unter DONE.

## Was fällt weg oder rutscht tiefer
- nichts (der kleine Hinweis beim Darüberfahren mit der Maus ist durch die Zeile über den Punkten ersetzt)

## Selbst entschieden
- Reihenfolge für Pfeiltasten und «‹ ›»: von links nach rechts nach Ruhepuls.
- Ein Tipp wählt den nächsten Punkt im Umkreis, damit kleine Punkte am Handy gut zu treffen sind.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Tour-Detailseite übersichtlicher: weiter geparkt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Fahrten › eine Fahrt › «Werte» › «Ruhepuls (Fitbit)»: Über den Punkten steht «diese Tour» mit Ruhepuls und NP oder Ø Puls.
2. Einen anderen Punkt antippen: Ein Fenster zeigt seine Zahlen und «Diese Fahrt öffnen».
3. «Als Tabelle» antippen: Alle Punkte stehen als Zeilen da.
