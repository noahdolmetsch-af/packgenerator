# «Weiter zu …» am Seitenende

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «ja» (Thread «Navigation ohne Sackgassen», Punkt 3 «Keine Sackgassen»)

## Was ist neu
- 27 Seiten, deren einziger Link zurück zu ihrem Ort führte (Stopps in der Nähe, Quiz am Vorabend, Kleine Apps, Handbuch, Tour-Pfad, Weg zum Ziel, Kursblick …), enden jetzt mit einer ruhigen Zeile «Weiter zu» und bis zu drei Seiten, die meist als Nächstes kommen (`src/lib/nav/WeiterZu.svelte`, Liste `src/lib/nav/weiter.js`, in `src/App.svelte` vor «Diese Seite anpassen»).
- Die Liste ist von Hand geschrieben (kurz, mit Sinn), nicht aus der Karte abgeleitet: Ein Ableiten aus Ort und Reiter hätte nur wiederholt, was der Pfad oben schon verlinkt.
- Prüfungen: `tests/weiter.test.js` (jede Adresse ist eine echte Seite, jeder Name hat einen deutschen Text, keine Seite zeigt auf sich selbst) und `tests/e2e/weiter-zu.spec.js` (Handy und Computer: jede Seite der Liste endet mit der Zeile, ein Tipp öffnet die Seite, Zurück führt zurück).

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeile steht am Seitenende, nie über dem Inhalt (Content first); sie kommt vor «Diese Seite anpassen».

## Selbst entschieden
- Seiten, die schon viele Wege weiter haben (Reiter, Übersichten), bekommen keine Zeile.
- Kursblick hat eigene Reiter; die Zeile führt dort hinaus (Kleine Apps, Ich), statt die Reiter zu wiederholen.
- Noch nicht in der Liste: Seiten mit Daten- oder Zustandsabhängigkeit (Rennen, Unterwegs: eigener PR zu den Sackgassen), «Passt hier» und «Diese Seite anpassen» werden nicht zusammengelegt (eigener Schritt, wenn Noah es will).

## Entscheide
- Keine eigene Datei: Fortsetzung von `docs/decisions/wege-waechter.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Navigation ohne Sackgassen: Punkt 3 für die bekannten Sackgassen-Seiten. Folgt: Zurück am Eingang (nie aus der App), Suche nach Seiten und Abschnitten, gleiche Namen überall.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Stopps in der Nähe öffnen und ans Ende scrollen: «Weiter zu» zeigt «Weg zum Ziel», «Verpflegung und Wasser», «Touren».
2. Auf «Weg zum Ziel» tippen: die Seite öffnet. Zurück: du bist wieder bei den Stopps.
