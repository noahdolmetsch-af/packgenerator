# Einstellungen und Pflege erklären sich jetzt auch (Wegweiser 26a)

PR #<Nummer> · 03.11.2026 · Auftrag: Noah «speichere schritt 1-26 als geplant … freigabe» (01.11.2026), «freigabe bitte fortfahren» (03.11.2026), Thread «Entdeckbarkeit versteckter Funktionen planen»

## Was ist neu
- Die Karte «Was du hier tun kannst» steht jetzt auch auf Ich › Daten und Backup, Aussehen, Verbindungen, Erinnerungen aufs Handy, auf Velos › Pflege und auf dem Timer.
- Dort startet sie als eine Zeile (`FOLDED_FIRST`), damit die eigenen Knöpfe der Seite oben bleiben. Ein Tipp öffnet sie, die Wahl bleibt gespeichert.
- 37 neue Tipps «Gut zu wissen» in `src/lib/wissen/app.js` (Deutsch in `src/lib/i18n/de/wissen-app.js`): 26 aus der Vorbereitung von Schritt 20, 10 neue für die Erinnerungen aufs Handy, einer für «Sicherung prüfen».

- Korrektur: «Alle … zeigen» und offene «So geht's» gelten nur für die Seite, auf der du sie angetippt hast (vorher blieben sie beim Wechsel auf eine andere Seite offen).

## Was fällt weg oder rutscht tiefer
- nichts. Die Seiten bekommen oben eine zugeklappte Zeile; ihr Inhalt rutscht um diese eine Zeile tiefer.

## Selbst entschieden
- Zugeklappt wie bei Unterwegs, Packen und Velos (Noahs Entscheide vom 02.11.2026), weil diese Seiten viele eigene Schalter haben.
- Die Tipps für die Erinnerungen aufs Handy habe ich neu geschrieben, kurz und mit Velo-Bezug.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 Wegweiser statt Katalog: 26a gebaut. Offen bleibt 26d (Schlussmessung).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup öffnen: oben steht eine Zeile «Was du hier tun kannst». Darauf tippen.
2. Unter «Sicherung prüfen» steht «Gut zu wissen». Auch Ich › Erinnerungen aufs Handy zeigt Tipps.
