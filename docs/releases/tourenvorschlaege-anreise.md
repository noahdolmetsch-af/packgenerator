# Tourenvorschläge: Anreise

PR (Nummer nach dem Öffnen) · 23.11.2026 · Auftrag: Noah «alles umsetzen», «5a» (Thread «100 kluge MTB-Touren vorschlagen»). Schritt 2 von 6.

## Was ist neu
- **Anreise je Tour:** auf jeder Karte eine Zeile «Anreise etwa 1 h 45 hin und gleich zurück · ganzer Tag etwa 9 h», bei Einweg-Touren mit der Rückreise vom Ende. Ausgangspunkt ist der Wohnort, sonst der Zürcher Hauptbahnhof (wie bei «Nähe zuerst»).
- **ÖV mit Velo oder Auto** als Schalter; die Wahl bleibt auf dem Gerät.
- **Filter «Anreise»:** bis 1, 2 oder 3 Stunden (die längere Richtung zählt).
- **«Warum dieser Vorschlag?»** hat die Zeile «Anreise» mit dem ganzen Tag und sagt, ob er in einen halben Tag passt (höchstens 5 Stunden insgesamt). Die Zeile lässt sich wie die anderen abschalten.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Anreise ist eine **Schätzung aus der Luftlinie** (Noah «5a»): ÖV 30 Min. plus 0,75 Min. je km, Auto 10 Min. plus 0,95 Min. je km, auf 5 Minuten gerundet, überall als «grobe Schätzung» bezeichnet. Der echte Fahrplan (transport.opendata.ch, wie bei «Zug hin, Velo heim») kommt später auf Antippen; er würde den Wohnort an einen fremden Dienst schicken und wartet darum auf Noahs Ok.
- Die Berechnung liegt in `src/lib/vorschlaege/anreise.js` (rein, ohne Netz).
- Das Filter-Feld «Start» (km vom Wohnort) bleibt daneben bestehen.
- Fertig-Regel: Seite (Eintrag `f.tourvorschlag` gilt weiter), Absprung unverändert, «Gut zu wissen» nicht nötig (Seite nicht in `ON_PAGES`), leerer Zustand unverändert, App-Stand angepasst.

## Entscheide (eigene Datei `docs/decisions/tourenvorschlaege-anreise.md`)
- 23.11.2026: Anreise zuerst als Schätzung.

## Stand im Plan (roadmap.md / vorhaben.md)
- Tourenvorschläge: Schritt 2 von 6 (Anreise). Offen: Passt zu dir, Wetter, Lernen und Neuland, Untergrund und «Als Tour planen».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Tourenvorschläge › «Liste»: jede Tour hat eine Zeile «Anreise etwa … hin».
2. «Mit dem Auto» antippen: die Zeiten werden kürzer.
3. «Bis 1 h» antippen: nur Touren mit kurzer Anreise bleiben.
4. Eine Tour öffnen: unter «Warum dieser Vorschlag?» steht die Anreise mit dem ganzen Tag.
