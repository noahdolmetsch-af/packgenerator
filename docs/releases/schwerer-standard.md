# Ein schwerer Standard sagt es

PR #1101 · 27.10.2026 · Auftrag: Noah 26.10.2026 20:31 «1a» alle B-Fehler aus dem UI-Test 0.205 (Thread «Testen komplette App mit Fehlerliste»)

## Was ist neu
- Bausteine zeigt unter dem Gewichtsbalken einen ruhigen Satz, wenn «Standard» 5 kg oder mehr wiegt und «Aufräumen» weniger Teile vorschlägt: «Auf Bikepacking-Touren bringt dein Standard … mit (ohne Getragenes). «Aufräumen» schlägt N statt M Teile vor. Ansehen ›» (`standardHint` in src/lib/packcleanup.js). Kein Schema-Wechsel.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Satz nennt das Gewicht, das auf Bikepacking-Touren mitkommt (ohne Getragenes). Es kann kleiner sein als «Standard» im Balken, der alles zählt; darum sagt der Satz, was er zählt.
- Der Hinweis kommt auch, wenn noch keine Packregeln gespeichert sind (beim Bildermachen gefunden: er kam sonst nie).
- Die Grenze ist 5 kg (`HEAVY_STANDARD_G`), gezählt werden nur gewogene Teile.
- Der Satz steht nur auf Bausteine, nicht in Packen (Packen ist gerade in einem anderen PR offen).
- Nichts wird von selbst geändert; der Link führt zu «Packliste aufräumen».

## Entscheide (für decisions.md)
- 27.10.2026: Ein schwerer Standard sagt es (UI-Test 0.205 T13), Noah «1a» alle B-Fehler.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Test 0.205 (Ziel Alltag): T13 erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material › Bausteine: Bringt dein Standard auf Bikepacking-Touren 5 kg oder mehr, steht «Auf Bikepacking-Touren bringt dein Standard …» mit «Ansehen ›».
2. «Ansehen ›» öffnet «Packliste aufräumen».
