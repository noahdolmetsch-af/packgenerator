# Temperaturen nach Höhe auf Heute

PR folgt (baut auf PR «Temperaturen nach Höhe» auf) · 05.11.2026 · Auftrag: Noah «1b» (Thread «Temperaturen nach Höhe anzeigen»)

Zweiter von drei kleinen PRs (Wetterseite, Zeile auf Heute, «Skitour planen»).

## Was ist neu
- Heute: eine ruhige Zeile für den Wohnort, jeden Tag: «1’000 m 8° · 2’000 m 1° · 3’000 m −5°» (die Temperatur jetzt in dieser Höhe). Tippen öffnet die Wetterseite mit der ganzen Karte.
- Ohne Netz erscheint der zuletzt gemerkte Wert mit «Stand» und Uhrzeit.
- Ausschalten: Wetter › «Jetzt» › «Temperaturen nach Höhe» › «Orte und Gipfel wählen» › Haken «Temperaturen nach Höhe auf Heute zeigen».

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Zeile steht unter der Nebelzeile, am Ende der Wetterzeilen (neben Seetemperatur, Schneefallgrenze und Nebelgrenze).
- Auf Heute zählt immer der Wohnort, nicht die Orte, die du auf der Wetterseite zusätzlich gewählt hast.
- Eine Höhe ohne Wert (z. B. 1000 m, wenn der Wohnort höher liegt) fehlt in der Zeile; ohne jeden Wert fehlt die ganze Zeile.
- Die Einstellung `hoehe.heute` ist eine normale, mitgesicherte Einstellung.
- Keine neue Funktion in `features.js`: gehört zu «Wetter für eine Fahrt» (`f.weather`); Absprung ist die Zeile selbst. Eine leere Ansicht gibt es nicht (ohne Wohnort oder Wert fehlt die Zeile).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter: Temperaturen nach Höhe auf Heute (PR 2 von 3). Folgt: «Skitour planen».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute: unter der Wetterzeile eine graue Zeile «1’000 m … · 2’000 m … · 3’000 m …».
2. Ein Tipp öffnet die Wetterseite.
3. Dort «Orte und Gipfel wählen» öffnen und den Haken bei Heute wegnehmen: die Zeile verschwindet auf Heute.
