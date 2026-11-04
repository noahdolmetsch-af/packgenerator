# Das Wetter am Logo

PR (diese Änderung) · 03.11.2026 · Noah 03.11. «H1 H2 H6 H7 H8 H9» (Thread «Sammeln: Geheimmenü-Ideen fürs Logo»), H9 «Logo-Wetter»; Ziel 5 «Alltag», Entscheid 26.10. «Bewegung überall sanft»

Baut auf der Zufallswahl `src/lib/logo/surprises.js` (H6) auf.

## Was ist neu
- Fünfmal schnell auf «PG» tippen kann jetzt das Wetter von jetzt zeigen: Eine Blase am Logo mit einer kleinen Zeichnung (Sonne, Regenwolke, Schnee) und dem Satz von Heute, z. B. «14° und trocken bis 17 Uhr.» (etwa vier Sekunden).
- Sonne: es bleibt in den nächsten Stunden trocken. Regenwolke: bald Regen, danach erscheint ein kleiner Regenbogen. Schnee: Regen bei höchstens 1 °C.
- Es nutzt dieselbe Vorhersage des Wohnorts wie Heute (`homeForecast`, auf dem Gerät gespeichert, offline der letzte Stand). Ohne Wohnort oder ohne Vorhersage steht dort «Kein Wetter geladen.»
- Mit «Bewegung reduzieren» bewegt sich nichts (auch kein Regenbogen).

## Was fällt weg oder rutscht tiefer
- nichts. Die anderen Überraschungen kommen etwas seltener, weil das Wetter mitwählt.

## Selbst entschieden
- Keine neue Wetter-Abfrage: derselbe Satz wie auf Heute (`weatherLine`) und dieselbe gespeicherte Vorhersage, damit das Logo nie etwas anderes sagt als Heute.
- Länger als 1,5 Sekunden wartet das Logo nicht auf die Vorhersage, dann sagt es «Kein Wetter geladen.»
- Die Wolke zeigt keine Bewölkung (die Vorhersage kennt nur Regenwahrscheinlichkeit und Temperatur), nur Sonne, Regen oder Schnee.
- Nicht abschaltbar und nicht im Funktionskatalog (wie das Velo: ein Geheimnis). Verraten nur im «Neu»-Eintrag.
- Keine Zeile in `docs/app-stand.md`: keine neue Seite und keine neue Funktion mit Link.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- `vorhaben-liste.md`: H9 «gebaut (PR)».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute oben links fünfmal schnell auf «PG» tippen, mehrmals: manchmal erscheint das Wetter mit Zeichnung und Satz, wie auf Heute.
2. Der Satz stimmt mit der Wetterzeile auf Heute überein.
3. Nur dreimal tippen: nichts passiert.
