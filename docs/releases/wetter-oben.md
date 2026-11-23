# Wetter oben auf Heute: eine kleine Karte

Auftrag: Noah 23.11.2026 «ICH MÖCHTE DIESE INFOS ZWINGEND DRIN HABEN» und Wahl «b» (Thread «Prototyp»). Schritt W1: nur die Karte. Die neuen Karten «Wetter der Woche», «Kette ölen» und «Fahrfenster» folgen als eigener PR.

## Was ist neu
- Auf Heute ist das Wetter eine Karte: links «Jetzt» (Temperatur, Wind, Regen, Hinweise), rechts die Höhenleiter mit der Schneefallgrenze, darunter eine Reihe mit Nebelgrenze, Nacht und Seetemperatur.
- Alle Infos stehen offen da; jede Zeile behält ihren eigenen Schalter auf der Wetterseite.
- Die Karte braucht auf dem Handy etwa ein Fünftel der Bildschirmhöhe (gemessen mit erfundenen Daten: 185 von 844 px).

## Was fällt weg oder rutscht tiefer
- Die geschlossene Zeile «Wetter heute» (Schnee, Nebel, Nacht in einem Klapp-Feld) fällt weg; ihre Zeilen stehen jetzt offen in der Karte. Die Infos selbst bleiben alle.

## Selbst entschieden
- «Maximal 20 Prozent» lese ich als etwa ein Fünftel der ersten Bildschirmhöhe auf dem Handy.
- Die kleinen Zeilen verlieren in der Karte ihren eigenen Kasten (Hintergrund, Rand), damit sie nicht doppelt gerahmt sind.
- Die Tests, die das Klapp-Feld öffneten, warten jetzt auf die Karte (`openWetterFold`); geprüft wird dasselbe.
- Die Zeile «Mehr aus dem Wetter» in den Neuigkeiten zeigt jetzt auf die Karte statt auf das Klapp-Feld.

## Entscheide (eigene Datei)
- `docs/decisions/wetter-oben.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter auf Heute: W1 (Karte) fertig, W2 (Wetter der Woche, Kette ölen, Fahrfenster) folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute an einem Tag mit geplanter Tour: die Wetterkarte steht weit oben mit Temperatur, Wind und Regen.
2. Rechts in der Karte stehen die Temperaturen nach Höhe und die Schneefallgrenze, ohne etwas zu öffnen.
3. Wetter › eine Zeile ausschalten: sie verschwindet aus der Karte.
