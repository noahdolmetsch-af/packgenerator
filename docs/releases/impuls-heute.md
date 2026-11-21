# Impuls für heute jeden Tag, passend zu Wetter und freier Zeit

PR #<Nummer> · 21.11.2026 · Auftrag: Noah «mit dieser» (Thread «App-Landkarte»)

## Was ist neu
- Auf Heute steht jeden Tag die Zeile «Impuls für heute», nicht mehr nur an Tagen ohne Fahrt-Vorschlag.
- Die Idee passt zum Wetter des Tages: bei trockenem Wetter eine Idee für draussen (Unterwegs, Natur, Abenteuer), bei Regen eine für drinnen. Die Zeile sagt dazu «passt zum Wetter».
- Ist der Kalender an (Ich › Termine und Aufgaben) und bis zum nächsten Termin bleiben weniger als 30 Minuten, kommt eine kurze Idee («passt in deine freie Zeit»).
- Ohne Wetter oder ohne Kalender bleibt alles wie bisher (eine Idee pro Tag).

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeile stand schon auf Heute; sie fehlte nur an Tagen mit Fahrt-Vorschlag.

## Selbst entschieden
- Aus den 30 Impulsen gelten diese Bereiche als «draussen»: Unterwegs, Natur, Abenteuer. Als «kurz» gelten acht Impulse, die eine Minute oder ein Lied lang dauern (Liste `IMPULSE_SHORT` in `src/lib/frei.js`).
- Wäre nach dem Passen nichts mehr übrig (zum Beispiel alle Draussen-Ideen ausgeblendet), gilt das Wetter nicht und es bleibt bei einer Idee pro Tag.
- Die Idee kann sich im Lauf des Tages ändern, wenn sich der Termin nähert (unter 30 Minuten frei); das Wetter ist der Tageswert von Heute.
- Eigene Impulse ohne Bereich zählen als «nicht draussen». Das passt später mit eigenen Bereichen besser.
- Keine Datenänderung, kein neuer Schalter: der bestehende Schalter auf der Seite Impulse stellt die Zeile ab.

## Entscheide
Siehe `docs/decisions/impuls-heute.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Impulse-Umzug, zweiter Schritt («Impuls für heute» täglich): erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: die Zeile «Impuls für heute» steht da, auch an einem Tag mit Fahrt-Vorschlag.
2. Bei Regen: die Idee ist keine Draussen-Idee und die Zeile sagt «passt zum Wetter».
3. «Mehr Impulse» tippen: die Seite Impulse bei Freie Zeit öffnet sich.
