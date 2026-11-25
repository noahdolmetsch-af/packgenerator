# Wege-Wächter: Pfad, Sackgassen und Zurück auf jeder Seite prüfen

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «ja» (Thread «Navigation ohne Sackgassen»)

## Was ist neu
- Nichts in der App. Neuer Test `tests/e2e/wege-waechter.spec.js` (nur Computer, rund 5 Minuten): Ein Roboter öffnet jede der rund 250 Adressen aus dem Code und prüft:
  1. **Pfad:** Der Pfad über der Seite beginnt mit dem Ort, der links markiert ist.
  2. **Sackgasse:** Die Seite hat mindestens einen Link auf eine andere Seite.
  3. **Zurück:** Die Zurück-Taste des Browsers führt von der Seite wieder nach Heute.
- Gemessen am Stand von heute (Rundgang mit leerer App, Deutsch, Computer):
  - **46 Seiten mit falschem Pfad.** Beispiele: Alle Seiten unter Woche › Training sagen «Aktiv › …» (Aktiv gibt es seit 21.11. nicht mehr als Ort). «Ich › Daten › Zusammenhänge» steht unter Auswerten › Körper. Material-Seiten sagen «Material», der Ort heisst «Velos und Material». Körperwerte sagen «Aktiv», liegen aber unter Auswerten.
  - **5 Sackgassen:** «Unterwegs» ohne Tour und die Rennseiten mit einer unbekannten Rennnummer zeigen nichts und keinen Weg weiter.
  - **2 Zurück-Fallen:** `#/inbox/new` und `#/komoot/shared` öffnen nach dem Laden eine zweite Adresse, die Zurück-Taste landet auf der Zwischenstation.
- Die drei Listen `PFAD_OFFEN`, `SACKGASSE_OFFEN`, `ZURUECK_OFFEN` oben im Test halten das fest. Sie dürfen nur kürzer werden. Ein **neuer** Fall macht den Test rot («schreib die Seite richtig»). Ein behobener Fall druckt nur eine Notiz, damit der PR eines anderen Threads, der eine Seite repariert, nicht wegen der Liste rot wird.
- Viele Wege zum gleichen Ziel: Der Pfad wird heute von sieben verschiedenen Bausteinen gezeichnet (`PathLine`, `PathHead`, `Crumbs`, `Crumb` in Aktiv, `VeloHead`, `TripBand` und etwa zehn Pfade, die direkt in Seiten stehen). Jeder schreibt seinen Ort von Hand. Darum laufen sie auseinander, wenn ein Ort umbenannt oder verschoben wird. Der nächste PR zieht den Anfang des Pfads aus einer Quelle (`placeOf` und `tabOf` in `src/lib/nav.js`).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Test läuft nur auf dem Computer, weil dort die Seitenleiste (der markierte Ort) steht. Am Handy zeigt der Pfad nur den letzten Schritt.
- «Sackgasse» heisst: kein einziger Link `#/…` im Hauptteil der Seite. Das ist die schwächste sinnvolle Grenze. Sie wird später verschärft (jede Seite endet mit «Weiter zu …»).
- Der Test liest die Adressen aus dem Quelltext wie `tests/links.test.js` und lässt Seiten für Leute ohne App (geteilte Liste, Karte, Anmeldung, Bezahl-Link, Shop) aus.
- Ein Fall zählt erst, wenn er nach 1,5 Sekunden Wartezeit noch besteht (späte Seiten), damit der Test nicht flackert.

## Entscheide (eigene Datei `docs/decisions/wege-waechter.md`)
- 23.11.2026: Reihenfolge Wächter zuerst, dann Fundament. Grund: Erst messen, dann reparieren, und keine neue Sackgasse während des Umbaus.

## Stand im Plan (roadmap.md / vorhaben.md)
- Navigation ohne Sackgassen: Schritt 1 (Messen und Wächter) mit diesem PR. Folgt: Pfad aus einer Quelle, Zurück und Scroll-Position, «Weiter zu …», Suche nach Seiten, Zuletzt besucht.

## Prüfschritte
1. Nichts zu prüfen in der App. Auf GitHub läuft `e2e (desktop)` grün, darin `wege-waechter.spec.js`.
