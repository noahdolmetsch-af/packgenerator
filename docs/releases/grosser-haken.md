# Der grosse Haken zeichnet sich

Neuer Schwung 2b · 27.10.2026 · Auftrag: Noah «5b» Lottie für grosse Momente (26.10.2026), bewegte Bilder freigegeben mit «freigabe», danach «bei 2b ist die animation viel zu schnell» (27.10.2026, Thread «Neuer Schwung fürs Design»)

## Was ist neu
- Bei grossen Momenten («Gepackt», «Tour beendet», Zwischenseiten) wächst ein grüner Kreis und der Haken zeichnet sich.
- Kreis und Haken brauchen zusammen etwa 1,3 Sekunden (nach Noahs «viel zu schnell» langsamer).
- Mit «Bewegung reduzieren» bleibt der stille Haken wie bisher. Das Konfetti bleibt.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Spieler lottie-web light (MIT, gratis) statt dotlottie (grosses wasm). Er ist ein eigener Teil von etwa 169 KB und lädt erst im grossen Moment.
- Die Animation ist selbst gezeichnet (`src/lib/ui/lottie/done.json`, 2 KB): keine Lizenzfrage.
- Die Farben kommen per CSS aus den App-Farben, damit jede Farbpalette passt.
- 24 statt 60 Bilder pro Sekunde, damit es ruhiger wirkt.

## Entscheide (für decisions.md)
- 27.10.2026: Lottie nur für grosse Momente, selbst gezeichnet, langsamer nach Noahs Rückmeldung.

## Stand im Plan (roadmap.md / vorhaben.md)
- Neuer Schwung (docs/vorhaben-liste.md): Schritt 2b mit diesem PR; als Nächstes Packen Teil 1 (Taschen mit Ringen), Aufklappen am Handy, Stil S2 auf Heute.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › eine Tour › Packen: alle Taschen packen und «Weiter» tippen.
2. Auf der Seite «Gepackt» wächst ein grüner Kreis, dann zeichnet sich der Haken (etwa 1 Sekunde).
3. Mit «Bewegung reduzieren» auf dem Gerät steht der Haken sofort still da.
