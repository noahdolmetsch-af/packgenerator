# Der Werkzeugkasten erklärt sich selbst (Wegweiser, nach der Schlussmessung)

PR #<Nummer> · 03.11.2026 · Auftrag: Noah «a» auf die Frage nach der Schlussmessung (03.11.2026), Thread «Entdeckbarkeit versteckter Funktionen planen»

## Was ist neu
- Touren › Werkzeugkasten hat die Karte «Was du hier tun kannst», zugeklappt als eine Zeile (`FOLDED_FIRST`).
- 22 Tipps «Gut zu wissen» für die Mini-Werkzeuge in `src/lib/wissen/alltag.js`, Deutsch in `src/lib/i18n/de/wissen-alltag.js`.

- Tempo: Alle Tipps «Gut zu wissen» (Englisch und Deutsch, rund 150 KB) laden erst, wenn eine Karte «Was du hier tun kannst» erscheint, nicht mehr beim Start (`src/lib/wissen/load.js`, `src/lib/wissen/texte-de.js`, `addDe()` in `src/lib/i18n.svelte.js`). Ohne das lag der Start mit den 22 neuen Tipps über der Grenze von 4,5 MB (`scripts/size-guard.mjs`); jetzt liegt er deutlich darunter.

## Was fällt weg oder rutscht tiefer
- nichts. Die Werkzeuge rutschen um eine zugeklappte Zeile tiefer.

## Selbst entschieden
- Die Tipps einer Funktion, deren Deutsch in ihrer eigenen Datei steht (nicht in `de/wissen-*.js`), bleiben im Start; der Test prüft beide Orte.
- Zugeklappt wie die Einstellungen (Schritt 26a), weil die Seite selbst schon eine Liste der Werkzeuge ist.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 Wegweiser statt Katalog: letzte Lücke aus der Schlussmessung vom 03.11.2026 geschlossen. Ohne Karte bleiben bewusst Heute, Live und die Übersichten.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Werkzeugkasten öffnen: oben steht eine Zeile «Was du hier tun kannst». Darauf tippen.
2. Auf «Alle … zeigen» tippen: «Kompass» und «Wasserwaage» stehen dort mit «Gut zu wissen».
