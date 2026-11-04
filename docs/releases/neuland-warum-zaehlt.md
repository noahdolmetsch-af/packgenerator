# Warum zählt das?

PR (noch offen) · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4b 5a» (Thread «Plane Entdecken und Sammeln»), Idee 6 «Nachvollziehbare Anerkennung»

## Was ist neu
- Neuland › ein Ort antippen, den die App auf deiner Route gefunden hat: unter «Zum ersten Mal» steht die Box **«Warum zählt das?»** (`src/lib/neuland/ItemProof.svelte`, Logik `src/lib/neuland/beleg.js`).
- Sie sagt in einem Satz, an welchem Tag und aus welcher Quelle (Tour, hochgeladene Fahrt, Strava, Aufzeichnung) deine Linie wie viele Meter am Ort vorbeiging, und zeigt eine kleine Karte: deine Linie, der Ort, der nächste Punkt der Linie, die Zone, in der es zählt, und ein Massstab. Die Karte braucht kein Netz.
- «Klarer Treffer» (bis zur Hälfte der Zone) oder «Knapp» (am Rand der Zone), bei «Knapp» mit dem Hinweis auf «Doch nicht da gewesen».
- Von Hand angehakte Orte sagen, dass die App sie auf keiner Route gefunden hat. Ein Ort mit «nicht dort» zeigt ebenfalls, wie die App ihn fand.
- Gebiete (Kantone, Gemeinden, Länder, Seen mit Umriss) zeigen einen Satz ohne Karte.

## Was fällt weg oder rutscht tiefer
- nichts. Das Fenster eines Orts hat eine Box mehr.

## Selbst entschieden
- Erster Schritt der Reihenfolge aus dem Überblick (Noah 5a): nur Neuland. Die gemeinsame Regel für Pässe (Noah 1a: bis 600 m sicher, bis 1,2 km «bitte bestätigen») und die Verlinkung aus «Pässe sammeln» und Gipfelbuch (2a) sind die nächsten kleinen PRs; die Erkennung selbst ist hier unverändert.
- «Klar» heisst: Abstand höchstens die Hälfte der Zone. Das ist nur eine Anzeige, es ändert nichts an dem, was zählt.
- Tour ohne Linie (nur Start): die Karte zeigt den Punkt, ein Satz sagt «nur der Start zählte».
- Fertig-Regel: kein neuer Ort und keine neue Funktion im Katalog (Teil des Fensters in `f.neuland`); Absprung ist das Fenster selbst, leere Zustände gibt es nicht (nur Orte mit Fund haben die Box), «Als Nächstes» entfällt, `docs/app-stand.md` bekommt bei der Zeile Neuland einen Halbsatz.

## Entscheide (für decisions.md)
- nichts

## Stand im Plan
- Entdecken und Sammeln: Schritt 1 von 7 (Warum zählt das?). Als Nächstes die gemeinsame Regel für Pässe.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick › Neuland, eine Sammlung wie «Alpenpässe» öffnen, einen Ort mit grünem Haken antippen.
2. Unter «Zum ersten Mal» steht «Warum zählt das?» mit Karte und Satz («… ging deine Linie … m am Ort vorbei»).
3. Einen angehakten Ort ohne Fahrt öffnen: die Box sagt, dass die App ihn nicht auf einer Route fand.
