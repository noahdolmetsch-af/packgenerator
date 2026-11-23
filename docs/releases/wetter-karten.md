# Drei neue Wetterkarten auf Heute

Auftrag: Noah 23.11.2026 Wahl «b» (Thread «Prototyp»), Schritt W2. Baut auf der Wetterkarte (`wetter-oben`) auf.

## Was ist neu
- Unter der Wetterkarte stehen bis zu drei kleine Karten für den Wohnort:
  - «Wetter der Woche»: der beste Tag zum Fahren in den nächsten 7 Tagen, für eine Fahrt von 2 Stunden, mit Zeit, Temperatur, Regen und einem Wort (Gut, Mittel, …). Führt zur Wetterseite.
  - «Nach dem Regen: Kette ölen»: ab 1 mm Regen in den letzten 24 Stunden und mit mindestens einem Velo. Führt zur Runde «Nach der Regenfahrt».
  - «Fahrfenster»: bis wann es heute trocken bleibt und bis wann es hell ist (Licht an 30 Minuten vor Sonnenuntergang).
- Jede Karte lässt sich mit «Heute nicht» für den Tag weglegen. Ohne Wetterdaten oder ohne Wohnort zeigt sich keine.
- Die Regeln stehen in `src/lib/wetter/heutekarten.js` und nutzen nur Daten, die die App schon hat (Wetterkern, Sonnenzeiten).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Kein neuer Eintrag in `features.js`: die Karten gehören zum Eintrag «Wetter für eine Fahrt» (`f.weather`) und stehen in der Zeile «Wetter» von `docs/app-stand.md`.
- «Kette ölen» zeigt sich nur mit einem Velo in der App, weil es sonst nichts zu ölen gibt. Es fragt nicht nach dem letzten Ölen: die App kennt nur die Kilometer seit der Pflege, nicht den Regen dazwischen.
- Die Karten brauchen auch ohne geplante Tour das Wetter des Wohnorts; es kommt aus dem Speicher der App und wird höchstens alle 3 Stunden neu geholt.
- Ein «Heute nicht» gilt bis Mitternacht (Einstellung `heuteKartenOff`, nur auf diesem Gerät).

## Entscheide (eigene Datei)
- Siehe `docs/decisions/wetter-oben.md` (Wahl «b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter auf Heute: W1 und W2 fertig.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute: unter der Wetterkarte stehen bis zu drei kleine Karten.
2. «Heute nicht» bei einer Karte: sie geht, die anderen bleiben.
3. Nach einem Regentag: «Kette ölen» führt zur Runde «Nach der Regenfahrt».
