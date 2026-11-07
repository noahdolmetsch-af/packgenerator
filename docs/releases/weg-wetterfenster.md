# Weg zum Ziel: Wetterfenster (K7)

PR #1138 · 07.11.2026 · Auftrag: Noah «4a» (Wetterfenster ab 7 Tagen vor dem Start, Entwurf G3), Thread «Entwerfen Weg zum grossen Ziel»

## Was ist neu
- Neue Schrittart **Wetterfenster** (`src/lib/weg/types/wetter.js`): ein Vorschlag «Wetterfenster prüfen», 7 Tage vor dem Start.
- Ab 7 Tagen vor dem Starttag steht über der Linie die Karte «Wetterfenster zum Start»: die Tage von drei vor bis drei nach dem Start (ab heute) mit der Regenchance, trockene Tage grün umrandet, nasse grau, der Starttag mit Rahmen. Darüber ein ruhiger Satz: «Fr. 13. bis Sa. 15. trocken», «Dein Start liegt in einem trockenen Fenster», bei nassem Start «Dein Start sieht nass aus (60 % Regen). Nur ein Hinweis: du entscheidest.», und bei nassen Tagen davor «die Generalprobe lieber drinnen».
- Gelesen wird nur die **Vorhersage, die die Tour schon gespeichert hat** (`trip.forecast`, `weather.js`): die Tour des Weges (`tripId`, sonst die Tour mit gleichem Starttag). Es wird nichts geladen, es geht also auch ohne Netz.
- Als «nass» gilt die eine Regengrenze der App (`rainlimit`, standardmässig 30 %).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Hat die Tour keine gespeicherte Vorhersage, sagt die Karte das in einem Satz und führt mit «Öffnen» zu Packen, wo das Wetter geladen wird (statt selbst zu laden: kein neuer Netzzugriff, keine neuen Ausfälle).
- Vor dem Fenster (mehr als 7 Tage) und nach dem Start steht nichts da; ohne Starttag auch nicht.
- Der **Startvorschlag bei offenem Zeitraum** («Start Do 11.06. setzen») aus dem Entwurf G3 ist ein eigener, nächster kleiner PR.
- Der Schritt tickt nie von selbst (`auto` ist null): Das Wetter ist ein Hinweis, du entscheidest.
- Nichts wird gespeichert; kein Eingriff in Datenhaltung oder Backup. «Gut zu wissen» entfällt (Seite ohne Karte «Was du hier tun kannst»).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G: «4a» gebaut (Fenster); als Nächstes Startvorschlag bei offenem Zeitraum, Rückblick (5a/5e/5c).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Weg zum Ziel, in einem Weg, dessen Starttag höchstens eine Woche entfernt ist und dessen Tour eine gespeicherte Vorhersage hat (Packen › «Wetter für diese Tour»).
2. Die Karte «Wetterfenster zum Start» zeigt die Tage mit ihrer Regenchance und einen ruhigen Satz.
3. Ohne gespeicherte Vorhersage steht dort ein Satz mit «Öffnen» zu Packen.
