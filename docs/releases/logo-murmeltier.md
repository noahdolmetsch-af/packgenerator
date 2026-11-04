# Ein Murmeltier hinter dem Logo

PR (diese Änderung) · 03.11.2026 · Noah 03.11. «H1 H2 H6 H7 H8 H9» (Thread «Sammeln: Geheimmenü-Ideen fürs Logo»), H2 «Murmeltier pfeift»; Ziel 5 «Alltag», Entscheid 26.10. «Bewegung überall sanft»

Baut auf «Velo-Weisheit» (H6, mit der Zufallswahl `surprises.js`) und «Ein Murmeltier als Begleiter» (Idee 28, Baustein `src/lib/murmeltier/Murmeltier.svelte`) auf. Es gibt nur eine Zeichnung des Murmeltiers.

## Was ist neu
- Fünfmal schnell auf «PG» tippen kann jetzt auch ein Murmeltier zeigen: Es steigt unten am Bildschirmrand aus seinem Loch, pfeift «Pfiiif!» in einer Sprechblase und taucht wieder ab (etwa drei Sekunden). Es ist der Baustein aus Idee 28 im Zustand `whistle`.
- Nachts (22 bis 6 Uhr) schläft es stattdessen mit «Zzz» (Zustand `sleep`).
- Mit «Bewegung reduzieren» am Gerät bewegt es sich nicht, es steht drei Sekunden unten.
- Es kommt nur, solange «Das Murmeltier» unter Ich › Darstellung › Bedienung an ist. Ist der Schalter aus, bleiben Velo und Sprüche.
- Die Überraschung wird weiter zufällig gewählt, nie dieselbe zweimal hintereinander.

## Was fällt weg oder rutscht tiefer
- nichts. Velo und Spruch kommen nur etwas seltener, weil eine dritte Überraschung mitwählt.

## Selbst entschieden
- Der Schalter «Das Murmeltier» gilt auch hier (wer das Murmeltier abgeschaltet hat, will es auch hinter dem Logo nicht).
- Nachts schläft das Murmeltier statt zu gähnen: dafür gibt es den Zustand schon, eine zweite Zeichnung ist unnötig.
- Die E2E-Tests legen den Zufall über `tests/e2e/logo-helpers.js` fest (nach Id, nicht nach Reihenfolge), damit weitere Überraschungen sie nicht stören.
- Keine Zeile in `docs/app-stand.md`: keine neue Seite und keine neue Funktion mit Link.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- `vorhaben-liste.md`: H2 in Arbeit.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute oben links fünfmal schnell auf «PG» tippen, mehrmals: manchmal pfeift unten ein Murmeltier (nachts schläft es).
2. Ich › Darstellung › Bedienung: «Das Murmeltier» ausschalten, nochmal mehrmals fünfmal tippen: das Murmeltier kommt nie.
3. Nur dreimal tippen: nichts passiert.
