# Ein Platten im Logo

PR (diese Änderung) · 04.11.2026 · Noah 03.11. «H1 H2 H6 H7 H8 H9» (Thread «Sammeln: Geheimmenü-Ideen fürs Logo»), H8 «Platten im Logo»; Ziel 5 «Alltag», Entscheid 26.10. «Bewegung überall sanft»

Baut auf PR «Velo-Weisheit» (H6, #775) auf: dieselben fünf Tipps, derselbe Code (`src/lib/logo/`).

## Was ist neu
- Fünfmal schnell auf «PG» tippen kann jetzt auch einen Platten bringen: das «PG»-Zeichen wird flach (Luft raus), eine Sprechblase sagt «Pssssst …» und «Zum Glück nur im Logo.», dann wird das Zeichen in ein paar Stössen wieder aufgepumpt (etwa dreieinhalb Sekunden).
- Es ist eine dritte Überraschung neben Velo und Spruch: Zufall, nie dieselbe zweimal hintereinander.
- Mit «Bewegung reduzieren» bleibt das Zeichen, wie es ist; nur die Blase steht da.

## Was fällt weg oder rutscht tiefer
- nichts. Velo und Spruch kommen jetzt etwas seltener (drei Überraschungen teilen sich die Tipps).

## Selbst entschieden
- Das Zeichen selbst wird mit der Web-Animation des Browsers gestaucht (nur `transform`), nicht durch neue Stile in der Seitenleiste oder der Kopfleiste. Nichts dort ändert sich.
- Die Blase hat denselben Platz und Stil wie der Spruch (`LogoFlat.svelte`).
- Nicht abschaltbar und nicht im Funktionskatalog (wie das Velo: ein Geheimnis). Verraten nur im «Neu»-Eintrag.
- Kein Eintrag in `docs/app-stand.md`: keine neue Seite und keine neue Funktion mit Link, die Zeile «Listen und Typen» bleibt.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- `vorhaben-liste.md`: H8 «gebaut (PR)».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute oben links fünfmal schnell auf «PG» tippen; wenn Velo oder Spruch kommt, nach dem Ende noch einmal fünfmal.
2. Bei einem Platten: «PG» wird flach, «Pssssst …» erscheint, dann ist es wieder rund.
3. In den Einstellungen «Bewegung reduzieren» einschalten: nur die Blase, das Zeichen bleibt.
