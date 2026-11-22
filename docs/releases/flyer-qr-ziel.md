# Wohin der QR-Code des Flyers führt

PR folgt · 10.11.2026 · Auftrag: Noah «QR-Code: b auf die Seite umstellen» (Thread «Landing Page für Tennis-Flyer planen»)

## Was ist neu
- Im Flyer (Tennis › Flyer, Teil «Anmeldeband mit QR-Code») gibt es das Feld «Wohin der QR-Code führt». Gibt Noah dort eine Adresse ein (auch ohne «https://»), zeigt der QR-Code auf dem Flyer und die gedruckte Adresse darauf, auf allen Flyern gleich.
- Bleibt das Feld leer (Standard), ändert sich nichts: der QR-Code führt zur Anmeldeseite des Angebots, wie bisher.
- Eine Eingabe, die keine Webadresse ist, zeigt einen Hinweis; der Flyer führt dann weiter zur Anmeldeseite.
- Der Text «Hier kannst du dich anmelden: …» in der vorbereiteten E-Mail nimmt dieselbe Adresse.

## Was fällt weg oder rutscht tiefer
- nichts. Ein Flyer ohne Eintrag verhält sich wie vorher.

## Selbst entschieden
- Ein Feld für den ganzen Flyer (nicht pro Stufe): bei «Ein Flyer pro Stufe» führen dann alle auf dieselbe Adresse. Wer pro Stufe einen eigenen Anmeldelink will, lässt das Feld leer.
- Nur http- und https-Adressen mit einem Punkt im Namen, höchstens 300 Zeichen, ohne Leerzeichen. Alles andere gilt als leer.
- Die Einstellung liegt im bestehenden Flyer-Eintrag auf dem Gerät (`tennis.flyers`) und kommt im Backup mit. Es ändert sich kein Schema und kein Backup-Format; ältere Flyer bekommen ein leeres Feld.
- Kein eigener Eintrag in `features.js`: Das ist eine Einstellung im bestehenden Flyer, keine neue Funktion.
- Für Noahs Flyer empfohlen: `tennisnoah.pages.dev/f`. Der Kurzlink `/f` hängt eine Messkennung an (`utm_source=flyer`), so zählt Cloudflare Web Analytics, wie viele vom Flyer kommen.

## Entscheide (für decisions.md)
- 10.11.2026: Der QR-Code des Tennis-Flyers führt auf die eigene Seite, nicht auf das Anfrageformular (Noah «b»: dort sind Preise und Vertrauen, und er sieht, wie viele vom Flyer kommen).

## Stand im Plan (roadmap.md / vorhaben.md)
- Tennis-Flyer: Ziel des QR-Codes wählbar. Als Nächstes: Druckmuster A5.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Tennis › Flyer, «Anmeldeband mit QR-Code» einschalten, bei «Wohin der QR-Code führt» `tennisnoah.pages.dev/f` eintragen. Der Text darunter sagt, dass es deine eigene Seite ist.
2. Flyer speichern, QR-Code mit dem Handy scannen: die Seite öffnet sich.
3. Etwas wie «kein link» eintragen: ein Hinweis erscheint. Feld leeren: der QR-Code führt wieder zur Anmeldeseite.
