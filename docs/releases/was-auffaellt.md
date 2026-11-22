# Was auffällt

21.11.2026 · Auftrag: Noah «ok einverstanden» 22:23 (Thread «Bauen: Sportjahr und Auswertung aller Sportarten», Auftrag K3, baut auf K1 und K2)

## Was ist neu
- **Karte «Was auffällt»** auf «Form und Erholung»: Liegt das Mittel der letzten 3 Ruhepuls-Tage (mindestens 2 Werte) mindestens 3 Schläge über deinem Normal, steht dort «Dein Ruhepuls liegt seit N Tagen X Schläge über deinem Normal.» mit der Frage «Weisst du, woran es liegt?» und dem Knopf **«Marker setzen»**. Der Knopf öffnet das Marker-Fenster (K1) mit den betroffenen Tagen vorausgefüllt.
- **Nie eine Ursache, nie «zu viel trainiert», kein Ratschlag.** Immer «Tendenz». (Vorprüfung: nur 3 von 8 Phasen hatten viel Training davor.)
- **Normal** = die Mitte der letzten 28 Ruhepuls-Werte vor den letzten 3 Tagen. **Markierte Tage** (K1) zählen weder ins Normal (es wird weiter zurück gesucht) noch als Auslöser; so bleibt das Normal nach einer Verletzung sauber, statt anzusteigen. Ist der neueste Tag markiert, beurteilt die Karte nichts.
- Andere Zustände mit ruhigem Satz: «Nichts fällt auf», «Noch zu wenig Ruhepuls-Werte» (unter 14), «Kein Ruhepuls der letzten Tage» (neuester Wert älter als 3 Tage).
- **«So gerechnet»** erklärt die Regel und lässt die Grenze ändern («Schläge über dem Normal», Standard 3, 1 bis 10), mit «Zurück zu den üblichen Werten». Neue Einstellung `training.auffaellt` in `db.settings` (kein Schema-Wechsel).
- Neue Dateien `src/lib/flow/form/auffaellt.js` (rein, Tests `tests/form-auffaellt.test.js`), `FormAuffaellt.svelte`; `MarkerSheet.svelte` bekommt die Angabe `prefill`; `tests/e2e/auffaellt.spec.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Die Karte steht über «Form im Vergleich zu früher».

## Selbst entschieden
- **«seit N Tagen»** zählt die Tage in Folge bis zum neuesten Wert, die mindestens eine halbe Grenze (1.5 Schläge) über dem Normal liegen.
- **Frische:** der neueste Wert darf höchstens 3 Tage alt sein, sonst «Kein Ruhepuls der letzten Tage» (statt etwas Altes als aktuell zu zeigen).
- **Nur eine Schwelle änderbar** (die Schläge); Tage (3) und Normal-Länge (28) stehen im Code.
- **Absprung:** der Knopf «Marker setzen» ist der Weg von der Beobachtung zum Marker (Fertig-Regel Teil 2 und 5); Leerzustände sind die Sätze oben.

## Entscheide (eigene Datei `docs/decisions/was-auffaellt.md`)
- 21.11.2026: Regel und Wortlaut wie in Auftrag K3 (Noah «ok einverstanden»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Klügere Auswertungen: K3 gebaut (baut auf K1 und K2). Offen: K4.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Form und Erholung › «Was auffällt»: der Satz zu deinem Ruhepuls (oder «Nichts fällt auf»).
2. Falls es etwas meldet: «Marker setzen» tippen, Art wählen, «Speichern»; die Karte sagt danach, dass nichts beurteilt wird. «Rückgängig» bringt die Meldung zurück.
