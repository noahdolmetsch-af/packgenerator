# Menü: «Weitere Orte» zeigt, was darunter liegt

PR folgt · 09.11.2026 · Auftrag: Noah «ja, 1 -3» (Thread «Durch die App klicken, Verbesserungen notieren», Fund 2)

## Was ist neu
- Auf einem Laptop-Fenster von 780 px Höhe endete das linke Menü unter «Touren». Aktiv, Auswerten, Velos, Ausrüstung, Material, Quick Links und Inspiration lagen darunter, ohne sichtbaren Hinweis (nur ein feiner Verlauf). Jetzt steht unten im Menü ein Knopf «Weitere Orte». Er scrollt das Menü nach unten und verschwindet am Ende.
- «Assistent» und «Hilfe» stehen nebeneinander in einer Zeile und sparen etwa 50 px.

## Was fällt weg oder rutscht tiefer
- nichts. «Assistent» und «Hilfe» bleiben im Menü, nur nebeneinander statt untereinander.

## Selbst entschieden
- Ein Knopf statt eines kleineren Menüs, damit keine Reiter verschwinden (Noah: nichts verstecken, alles änderbar).
- Der Knopf erscheint nur, wenn das Menü höher ist als das Fenster (bestehende Erkennung `edges()` in `SideBar.svelte`).
- Keine neue Funktion, darum keine Zeile in `features.js` und `app-stand.md`.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick 08.11.2026 abends: Fund 2 erledigt. Fund 3 liegt in einem eigenen PR, Fund 1 beim Thread «Hilfe-Karte».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Computer ein nicht sehr hohes Browserfenster nehmen (zum Beispiel 780 px) und «Touren» öffnen: unten im Menü steht «Weitere Orte».
2. «Weitere Orte» klicken: das Menü scrollt, man sieht Auswerten, Velos, Ausrüstung, Material, Quick Links und Inspiration.
3. «Assistent» und «Hilfe» stehen nebeneinander oben im Menü.
