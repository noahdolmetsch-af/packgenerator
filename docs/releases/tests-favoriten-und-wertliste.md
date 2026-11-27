# Tests «Heute neu» und «Was ist neu»: die neuen Karten mitzählen

PR #1850 · 27.11.2026 · Auftrag: Meldung des Bündlers (heute-neu.spec.js:165 rot) und des Releases-Threads (I11 und I11e rot auf main)

## Was ist neu
- Nichts Sichtbares geändert, nur Test für `tests/e2e/heute-neu.spec.js` («a stored wall of before (v 4) gets the new order once …») und `tests/e2e/wasneu-design.spec.js` (I11, I11e).
- **Ursache 1 (kein Wackler, kein Tageszeit-Fehler):** Seit der Favoriten-Karte (PR 1837) steht «Favoriten» ganz oben unter dem Gruss, ausserhalb der Wand (`data-pins-top`). Die beiden Tests lasen diese Karte nicht mit, erwarteten sie aber als erste Kachel. Vor Heute «bereit» steht die Karte noch in der Wand, darum war der Test nur in diesem kurzen Augenblick grün: je nach Rechnerlast mal ja, mal nein. Beide Tests lesen jetzt `data-pins-top` als erste Kachel, so stimmt die Liste in jedem Augenblick.
- **Ursache 2:** I11 sucht «Diebstahl» und erwartete genau eine Funktion. Seit PR 1833 erwähnt auch der Text von «Wertliste» das Diebstahl-Blatt, also gibt es zwei Treffer. Der Test sucht jetzt «Rahmennummer», ein Wort, das nur das Diebstahl-Blatt sagt.
- **Geprüft:** heute-neu.spec.js und wasneu-design.spec.js je 3× pro Gerät grün (vorher auf reinem main: heute-neu Zeile 165 und I11, I11e rot, jedes Mal).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur die Hilfsfunktion der Tests (`order`, `ids`) ist angepasst, keine Erwartung gelockert und keine Wartezeit verlängert.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: «e2e» grün. In der App nichts zu prüfen.
