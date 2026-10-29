# Eine Vorhersage

PR #431 · 27.10.2026 · Auftrag: Noah 26.10.2026 20:31 «1a» alle B-Fehler aus dem UI-Test 0.205 (Thread «Testen komplette App mit Fehlerliste»)

## Was ist neu
- Am Tag einer Tour mit eigenem Wetter (`trip.wx`, steht auf Packen und Unterwegs) richten sich Hitze, Kälte und Regen der Tipps «Passt zu heute» nach diesem Wetter (`tripWxOn` in src/lib/pageinfo.js). Ein Tipp sagt so nie «Regen» unter «trocken».
- Kacheln, die gleichzeitig nach dem Wetter zu Hause fragen, bekommen eine gemeinsame Antwort (src/lib/home-weather.js). «Deine Werte heute» sagt mit eingetragenem Wohnort «Wetter gerade nicht geladen» statt «Wohnort unter Ich eintragen». Kein Schema-Wechsel.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Wind und Föhn kommen weiter aus der Vorhersage zu Hause, weil das Tourwetter keinen Wind kennt.
- «Schauer» beim Tourwetter zählt als Regen für die Tipps.
- Der Befund «jeder Tag 11°» (G1-09, G3-20) kam von der Test-Vorhersage im UI-Test, die jeden Tag gleich war; die App rechnet jeden Tag einzeln. Darum keine Änderung dort.

## Entscheide (für decisions.md)
- 27.10.2026: Eine Vorhersage (UI-Test 0.205 T8), Noah «1a» alle B-Fehler.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Test 0.205 (Ziel Alltag): T8 erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne die Tour von heute in Packen: Steht beim Wetter «trocken», sagt kein Tipp «Regen ist angesagt».
2. Heute, «Deine Werte heute»: Das Wetter zeigt dieselben °C wie «Du heute».
