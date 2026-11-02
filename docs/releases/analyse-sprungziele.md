# Analyse: Sprungziele für andere Seiten

PR #<offen> · 27.10.2026 · Auftrag: Thread «Entwerfen klickbare Diagramme» (Tipp auf ein Diagramm irgendwo in der App öffnet Analyse)

## Was ist neu
- Zwei Links, die jede Seite nutzen kann: `valueHref(Wert, Zeitraum)` öffnet die Seite eines Werts (M6) gleich im gewünschten Zeitraum, `dayHref(Tag)` öffnet das Fenster «Ein Tag, alle Werte» (`src/lib/analyse/jump.js`).
- Im Bild ändert sich nichts.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Links sind einfache Adressen (`#/auswerten/analyse?tag=2026-10-05`, `#/auswerten/analyse/schlaf?zeit=w`), also auch mit «Zurück» und als Lesezeichen nutzbar.
- Schliessen des Tagesfensters nimmt `?tag=` wieder aus der Adresse.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Analyse-Tool: Grundlage für klickbare Diagramme auf anderen Seiten.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In der Adresszeile `#/auswerten/analyse?tag=` mit einem Datum der letzten Tage öffnen: das Tagesfenster geht auf.
2. `#/auswerten/analyse/sleep?zeit=w` öffnen: die Schlaf-Seite zeigt «W».
