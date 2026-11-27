# Packvorschläge nach Wetter und Lieblingsteilen pro Tasche

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «1-5» (Punkt 2; Thread «Packen nach Taschen am Bike ausbauen»)

## Was ist neu
- Unter dem Titel einer Tasche steht, wenn das Wetter ein Teil verlangt, das noch nicht gepackt ist, eine Zeile «Fürs Wetter noch in diese Tasche: + Regenjacke · Regen, + Überschuhe ★ …». Ein Tipp auf den Namen packt das Teil in diese Tasche (mit «Rückgängig» in der Meldung), das × daneben schlägt es auf dieser Tour nicht mehr vor. Lieblingsteile (★) stehen zuerst.
- Gibt es für ein Wetterteil Alternativen (zum Beispiel zwei Regenjacken) und ist eine davon ein Lieblingsteil, nimmt die App dieses statt des üblichen Teils. Hast du selbst getauscht (auch «zurück zum üblichen»), gilt deine Wahl.

- Gesamttest C10: Im Packvorschlag (`#/pack/vorschlag`) stehen die Namen der fehlenden Schichten und Stellen («Legs · Hands · Head · Feet») jetzt auf Deutsch; Wächter `tests/pack-vorschlag-zonen.test.js`.

## Was fällt weg oder rutscht tiefer
- nichts. «Liste prüfen» und die Zeile «Vorschläge offen» bleiben, wie sie sind.

## Selbst entschieden
- Ich habe «Packvorschläge nach Wetter und Lieblingsteilen pro Tasche» als zwei Dinge gelesen: Lieblingsteil zuerst unter Alternativen und eine Zeile pro Tasche (siehe `docs/decisions/wetter-tasche.md`).
- Nur Kälte und Regen, höchstens drei Teile pro Tasche, nur nicht getragene Teile; wer ein Teil mit × weglegt, bekommt es auf dieser Tour nicht mehr vorgeschlagen (Feld `layerPick` = «none», wie schon bei «Liste prüfen»).
- Die Wahl «zurück zum üblichen Teil» wird jetzt als Wahl gespeichert (vorher leer), damit ein Lieblingsteil sie nicht überstimmt.
- Daten: kein neues Feld, kein Dexie-Schema, kein neues Backup-Format; geschrieben wird nur `entries` und `layerPick` der Tour wie bisher.
- Ein Test (`v0550.spec.js`) wartet nach dem Verkleinern des Fensters jetzt auf den Zustand (`expect.poll`) statt sofort zu messen; er fiel unter Last zufällig, ohne Zusammenhang mit dieser Änderung.
- C10 habe ich in dieses Paket gelegt, weil es dieselbe Packvorschlag-Seite betrifft (Auftrag der Koordination). Nach dem Merge muss der Eintrag «bekannt» zu C10 im Gesamttest entfernt werden.
- Wächter: `tests/e2e/wetter-tasche.spec.js`, Regeln `tests/wetterbag.test.js`.

## Entscheide (eigene Datei `docs/decisions/wetter-tasche.md`)
- 24.11.2026: Wetter pro Tasche und Lieblingsteil unter Alternativen (Noah «1-5»)

## Stand im Plan (roadmap.md / vorhaben.md)
- Packen nach Taschen am Bike (Leitfaden): Packvorschläge nach Wetter und Lieblingsteilen gebaut

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine geplante Tour mit Regen im Wetter öffnen, in der noch keine Regenjacke liegt.
2. Unter dem Titel der Tasche, in die die Regenjacke üblicherweise kommt, steht «Fürs Wetter noch in diese Tasche: …».
3. Auf den Namen tippen: das Teil liegt in der Tasche; «Rückgängig» in der Meldung nimmt es heraus.
4. × tippen: das Teil wird auf dieser Tour nicht mehr vorgeschlagen.
