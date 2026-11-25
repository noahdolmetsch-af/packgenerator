# Handy: Die Hinweiskästen starten als eine Zeile

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 2, Antwort «1a»)

## Was ist neu
- Auf dem Handy starten «Gehört zu …» (Packen, Touren, Material, Velos) und «Alles hier» (Touren, Material, Velos) als je eine Zeile mit dem Namen und «Aufklappen». Ein Tipp öffnet den Kasten, «Einklappen» schliesst ihn wieder. Die Wahl bleibt gespeichert (Einstellung `karten.offen`, also im Backup).
- Vorher standen die beiden Kästen vor Packliste, Material oder Touren; man scrollte, bevor man tat, was man wollte. «Was du hier tun kannst» tat das auf diesen Seiten schon.
- Neue Datei `src/lib/ui/CardFold.svelte` (die Hülle) und `src/lib/ui/kartenzeile.js` (welche Kästen als Zeile starten).

## Was fällt weg oder rutscht tiefer
- Auf dem Handy: «Gehört zu …» und «Alles hier» auf Packen, Touren, Material und Velos sind erst nach einem Tipp auf die Zeile sichtbar. Computer und Tablet: nichts ändert sich. Planen, Aktiv, Ich, Wetter, Neuland, Rückblick: nichts ändert sich.

## Selbst entschieden
- Nur dort, wo «Was du hier tun kannst» schon als Zeile startet (Liste `START_FOLDED`), nicht überall: Planen und Aktiv haben «Alles hier» als Einstieg, der darf offen bleiben.
- «Handy» heisst wie sonst in der App: schmaler als 720 px.
- Tests: `tests/e2e/karten-zeile-handy.spec.js`, `tests/kartenzeile.test.js`; vier bestehende Specs öffnen die Zeile zuerst (`tests/e2e/karte-auf.js`).
- Die Browser-Tests (`tests/e2e/clock.js`) setzen `cardsOpen`: dort sind die Karten offen wie früher, damit Specs, die durch diese Karten klicken, nicht einzeln angepasst werden müssen. Specs, die die Zeile selbst prüfen (`karten-zeile-handy`, `tippzahl`, `heimat`), schalten es mit `test.use({ cardsOpen: false })` aus.
- «Ausprobieren» und die Sprungziele: findet das Ziel sich nicht, öffnet `spot.js` einmal alle Karten-Zeilen und sucht weiter (so liegt ein Ziel in einer eingeklappten Karte nicht im Leeren). Dieser Teil ist nur von Hand geprüft, nicht von einem eigenen Test.
- Zwei Taps gleichzeitig überschreiben sich nicht mehr (`CardFold.svelte` schreibt die Wahl nacheinander).

## Entscheide (für decisions.md)
- keine neuen (Noah «1a» steht in der Etappe-2-Antwort).

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick Etappe 2: Klasse-D-Frage 1 umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf dem Handy Touren öffnen: «Gehört zu …» und «Alles hier» sind je eine Zeile, die Tourenliste kommt zuerst.
2. Eine Zeile antippen, der Kasten geht auf; «Einklappen» schliesst ihn; nach dem Neuladen bleibt es so. Auf dem Computer sind beide offen.
