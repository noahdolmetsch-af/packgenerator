# Weg zum Ziel: Rückblick «geplant gegen wirklich»

PR # · 08.11.2026 · Auftrag: Noah «5a» (Entwurf G7, linke Karte), Thread «Entwerfen Weg zum grossen Ziel»

## Was ist neu
- Ist der Starttag eines Weges vorbei, steht über der Linie die Karte «Rückblick · Name» mit «Geplant gegen wirklich»: jeder Schritt mit geplantem Tag, daneben der Tag, an dem er abgehakt wurde, mit dem Unterschied («+5 Tage», «−4 Tage», «wie geplant») oder «Nicht gemacht».
- Nur die zwei Spalten, ohne Urteil.
- Dafür merkt sich ein Schritt jetzt den Tag, an dem er abgehakt wird (`doneAt`, von Hand und von der App).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Daten: ein zusätzliches Feld `doneAt` am Schritt im Eintrag `weg` (keine neue Tabelle, keine neue Dexie-Version, ältere Einträge laufen unverändert). Schritte, die vor dieser Version abgehakt wurden, haben keinen Tag und zeigen «Erledigt» ohne Zahl. Wieder abhaken löscht den Tag.
- Schritte ohne geplanten Tag stehen nicht im Rückblick (es gibt nichts zu vergleichen).
- Die Karte erscheint ab dem Tag nach dem Start.
- Der Vorschlag fürs nächste Mal (5e) und «Weg als Vorlage speichern» (5c) sind eigene, nächste kleine PRs.
- «Gut zu wissen» entfällt (Seite ohne Karte «Was du hier tun kannst»).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G: Rückblick 5a gebaut. Offen: 5e (Vorschlag fürs nächste Mal), 5c (Vorlage), Heute-Zeile.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Weg zum Ziel, Weg, dessen Starttag vorbei ist: Karte «Geplant gegen wirklich».
2. Einen Schritt abhaken: seine Zeile zeigt den Tag und den Unterschied zum Plan.
