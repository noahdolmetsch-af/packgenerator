# Genaue Zahlen in den Tour-Profilen

28.10.2026 · Auftrag: Noah «Diagramme sollen genaue Werte zeigen … und überall sonst» (Thread «Tour-Detailseite übersichtlicher machen»)

## Was ist neu
- Geschwindigkeitsprofil: Eine Zeile über dem Diagramm zeigt die genauen Zahlen: ohne Wahl «Ganze Fahrt» mit Ø Tempo und Fahrzeit, beim Zeigen die Zeit mit km/h, beim Ziehen den Abschnitt mit Ø Tempo und Dauer.
- «Als Tabelle» beim Geschwindigkeitsprofil: eine Zeile pro runder Zeitstufe (wie die Achse) mit Ø km/h.
- Höhenprofil (ohne Strava-Feindaten): Zeile darüber mit km und Höhe, ohne Wahl höchster und tiefster Punkt; «Als Tabelle» mit der Höhe alle paar km.

## Was fällt weg oder rutscht tiefer
- nichts (die Zeile mit den Zahlen steht jetzt über statt unter bzw. in der grauen Hinweiszeile; der Hinweis zum Tippen bleibt unter dem Diagramm)

## Selbst entschieden
- Die zwei Profile kommen noch nicht auf DONE in `src/lib/charts/rules.js`: Ein Tipp öffnet bei einem Profil kein eigenes Fenster, weil Tippen und Ziehen schon die Zahlen eines Abschnitts zeigen.
- Tabellen-Schritte = die runden Stufen der Achse (Zeit) bzw. etwa 10 runde km-Stufen (Höhe).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Tour-Detailseite übersichtlicher: weiter geparkt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Fahrten › eine Fahrt: Über das Geschwindigkeitsprofil ziehen, die Zeile darüber zeigt den Abschnitt mit Ø Tempo und Dauer.
2. Über dem Geschwindigkeitsprofil «Als Tabelle» antippen: eine Zeile pro Zeitstufe mit Ø km/h.
