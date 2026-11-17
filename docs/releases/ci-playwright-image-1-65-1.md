# CI: Playwright-Image auf 1.65.1

PR folgt · 17.11.2026 · Auftrag: Koordinator, weil `main` seit dem 12.11. rot ist (Thread «UI-Test der Seite Flow»)

## Was ist neu
- Die vier Image-Tags in `.github/workflows/deploy.yml` und `volle-pruefung.yml` stehen auf `v1.65.1-noble`. `package.json` verlangt `@playwright/test` 1.65.1 (Dependabot #1259 und #1264); `tests/ci-image.test.js` fällt sonst («update the image tag in deploy.yml»).
- Das Image `mcr.microsoft.com/playwright:v1.65.1-noble` gibt es (geprüft).
- Dieser PR ersetzt #1262, das auf 1.65.0 stellt und damit nach #1264 nicht mehr reicht. #1262 bleibt offen, bis Noah es schliesst.

- Dazu eine kleine Stabilisierung im Handy-Test «jede Funktion höchstens 3 Tipps» (`tests/e2e/tippzahl.spec.js`): der Roboter wartet, bis die Ladekarte (`[data-skeleton]`) weg ist, bevor er die Links zählt. Auf `main` zählte er sonst die Rückblick-Seite, bevor deren «Mehr»-Zeilen da waren, und meldete Pässe, Sammel-Wand und Tourenpass als zu weit weg. Die Grenze von 3 Tipps und die Liste `TAP_GAPS` bleiben unverändert.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die vier Tags und die eine Wartezeile im Test (ohne sie bleibt die Handy-Prüfung rot und der PR kann wegen der Pflichtprüfung nicht gemergt werden). Die Ursache ist eine Annahme aus dem Code (Ladekarte), lokal nicht nachstellbar; die CI zeigt, ob es reicht. Keine News-Datei und kein Eintrag in `app-stand.md`: in der App ändert sich nichts.

## Prüfschritte (nach dem Merge)
1. Auf GitHub unter Actions: «Build and deploy» auf `main` ist grün (`build` besteht).
