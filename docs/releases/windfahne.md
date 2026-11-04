# Eine Windfahne beim Wetter

PR (diese Änderung) · 03.11.2026 · Auftrag: Noah «b» (Paket D, Idee 15 «Windfahne beim Wetter»; Thread «Durchgehen: offene Fragen einzeln»); Ziel 5 «Alltag»

## Was ist neu
- Neben dem Wind steht eine kleine gezeichnete Fahne (`src/lib/wetter/WindVane.svelte`) statt des gewöhnlichen Wind-Symbols: in der Wetterzeile auf **Heute**, auf der **Wetterseite** (Heute-Block) und im **Wetter einer Tour**.
- Der Stab steht auf der Seite, woher der Wind kommt, das Fähnchen zeigt, wohin er weht, wie auf einer Karte (Norden oben): Wind aus Westen = Fähnchen nach rechts.
- Je mehr Wind, desto länger das Fähnchen und desto schneller flattert es (vier Stufen: Windstille unter 5 km/h, leicht, frisch ab 15, stark ab 30). Bei Windstille hängt es kurz und still.
- Bei «Bewegung reduzieren» flattert es nie. Ohne bekannte Windrichtung bleibt das alte Wind-Symbol.
- Der Text daneben («30 km/h aus Westen») bleibt, die Fahne ist nur Zeichnung (für Screenreader versteckt).

## Was fällt weg oder rutscht tiefer
- Das einfache Wind-Symbol (Linien mit Wirbel) in diesen drei Zeilen fällt weg; bei der Windwarnung («Föhn», «Bise») auf der Wetterseite bleibt es.

## Selbst entschieden
- Die Stufen (5, 15, 30 km/h) sind einfache Rundwerte, keine Fachgrenze; die Zahl daneben bleibt massgebend.
- Die Fahne zeigt die Richtung wie eine Karte (Norden oben), nicht wie eine Wetterfahne von der Seite: so passt sie zu «aus Westen» im Text.
- Keine eigene Funktion im Katalog (Zeichnung an bestehenden Zeilen, Fertig-Regel 1 bis 5 entfallen).
- `docs/app-stand.md` ist noch nicht auf `main` (PR #742 offen); die Zeile folgt nach dessen Merge.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket D «Laden, Leere und Wetter»: Idee 15 gebaut (14 in #776, 19 in #780; 10 und 20 folgen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute (bei einer Tour heute) oder Wetter öffnen: neben dem Wind steht eine kleine Fahne, das Fähnchen zeigt, wohin der Wind weht.
2. An einem windigen Tag flattert sie schneller als an einem ruhigen; bei Windstille hängt sie still.
3. «Bewegung reduzieren» am Handy einschalten: die Fahne steht still.
