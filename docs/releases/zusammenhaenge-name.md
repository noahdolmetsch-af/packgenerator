# Aus «Erkenntnisse» wird «Zusammenhänge»

PR #1783 · 21.11.2026 · Auftrag: Noah «1a» (Thread «App-Landkarte»)

## Was ist neu
- Zwei Seiten hiessen «Erkenntnisse»: «Gelernt» (deine eigenen Erkenntnisse nach Touren, `#/gelernt`) und die Seite mit den Zusammenhängen in deinen Daten (Ruhepuls, Schlaf, Fahrten, `#/me/insights`).
- Die zweite heisst jetzt überall «Zusammenhänge»: Reiter in Auswerten, Titel der Seite, Hinweise, Handbuch. Adressen bleiben gleich.
- Der Wächter `tests/links.test.js` hat keine bekannte Doppelung mehr; ein neuer gleicher Name zweier Reiter lässt ihn fehlschlagen.
- `docs/namen.md` hat die neue Zeile 32.

## Was fällt weg oder rutscht tiefer
- nichts. Nur der Name ändert sich; «Erkenntnisse» gehört nur noch den eigenen (Nr. 2).

## Selbst entschieden
- Auch die einzelnen Treffer heissen jetzt «Zusammenhang» statt «Erkenntnis» (z. B. «Wähle einen Zusammenhang.»), sonst bliebe das alte Wort im Text.
- Alte News-Einträge bleiben, wie sie waren.

## Entscheide (für decisions.md)
- 21.11.2026: Die Seite `#/me/insights` heisst «Zusammenhänge» (Noah «1a»; Doppelname mit «Erkenntnisse»).

## Stand im Plan (roadmap.md / vorhaben.md)
- App-Landkarte, Befund «zwei Reiter mit dem gleichen Namen»: behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten öffnen: im Reiter steht «Zusammenhänge» und, getrennt, «Erkenntnisse».
2. «Zusammenhänge» tippen: der Titel der Seite heisst auch so.
