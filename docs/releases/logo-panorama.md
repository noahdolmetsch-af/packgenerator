# Alpenpanorama am Logo

PR (diese Änderung) · 04.11.2026 · Noah 03.11. «H1 H2 H6 H7 H8 H9» (Thread «Sammeln: Geheimmenü-Ideen fürs Logo»), H7 «Alpenpanorama»; Ziel 5 «Alltag», Entscheid 26.10. «Bewegung überall sanft»

Baut auf der Zufallswahl `src/lib/logo/surprises.js` (H6) auf.

## Was ist neu
- Fünfmal schnell auf «PG» tippen kann jetzt die Alpen durchs Bild ziehen: drei Reihen Berge (hinten hell mit Schneekuppen, vorne dunkler) wandern in etwa fünf Sekunden von rechts nach links über den unteren Bildrand, die hinteren langsamer als die vorderen. Dazu steht «Schöne Aussicht!» in der Mitte.
- Mit «Bewegung reduzieren» stehen die Berge dieselbe Zeit still am unteren Rand.
- Die Farben kommen aus dem Aussehen der App (Hell, Dunkel, Akzentfarbe).

## Was fällt weg oder rutscht tiefer
- nichts. Die anderen Überraschungen kommen etwas seltener, weil die Alpen mitwählen.

## Selbst entschieden
- Reine Zeichnung (SVG), keine Bilddatei und kein Ton.
- Nicht abschaltbar und nicht im Funktionskatalog (wie das Velo: ein Geheimnis). Verraten nur im «Neu»-Eintrag.
- Keine Zeile in `docs/app-stand.md`: keine neue Seite und keine neue Funktion mit Link.
- Der Test `jahreszeit.spec.js` kannte das Wetter (H9) noch nicht als Überraschung und konnte zufällig rot werden. Alle Tests, die «irgendeine Überraschung» abwarten, nutzen jetzt eine gemeinsame Liste (`ANY_SURPRISE` in `tests/e2e/logo-helpers.js`).
- Beim allerersten Fund (neues Logo, Idee 30) erscheint bei den Alpen die Zeile «Neues Logo gefunden» nicht; das Logo wechselt aber sichtbar.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- `vorhaben-liste.md`: H9 «online», H7 «gebaut (PR)».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute oben links fünfmal schnell auf «PG» tippen, mehrmals: manchmal ziehen drei Reihen Berge über den unteren Bildrand, dazu «Schöne Aussicht!».
2. Danach ist alles wieder weg, nichts bleibt hängen und die Seite lässt sich nicht seitlich schieben.
3. «Bewegung reduzieren» einschalten: die Berge stehen still.
