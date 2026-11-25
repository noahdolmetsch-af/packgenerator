# Fenster nie abgeschnitten: fester Kopf und Fuss, weicher Rand, ein Wächter

PR (offen) · 24.11.2026 · Auftrag: Noah «a und b» (Thread «App mit impeccable schöner machen»), nach dem Bild vom Fenster «Wi gaht's? am Abend», das in der dritten Frage endete

## Was ist neu
- Jedes Fenster (`<dialog>`) ist höchstens so hoch wie der sichtbare Bildschirm (`dvh` statt `vh`, also auch unter der Adressleiste eines Handys) und scrollt, wenn es länger ist.
- Bei den neuen Fenstern (`.vdlg`, 88 Stück) bleiben Kopf (`.vd-head`) und Fuss mit dem Hauptknopf (`.vd-foot`) stehen, nur die Mitte scrollt. Das galt bisher nur für einige Fenster am Handy (`.daumen-foot`), jetzt auch am Computer.
- Ein weicher Rand oben und unten zeigt jedem scrollenden Fenster, dass noch etwas kommt (ohne Skript).
- 17 Fenster mit eigener Höhe in `vh` stehen jetzt zusätzlich in `dvh`.
- Der Abend- und Morgen-Check («Wi gaht's?») nimmt den festen Fuss (`vd-foot`); sein Umbau (eine Frage pro Bildschirm, `.vd-head` und fester Fuss) und der Test dazu liegen beim Thread «Wi gaht's?»; dieser PR fasst `AbCard.svelte` nicht an (Absprache 25.11.2026).
- Wächter: `tests/fenster-nie-abgeschnitten.test.js` (jedes Fenster passt und scrollt) und `tests/e2e/fenster-nie-abgeschnitten.spec.js` (echte Fenster bei Handy 390, Laptop 1440×700 und 1440×800, Computer 1440×900: Hauptknopf ganz sichtbar, kein Knopf am Rand angeschnitten, wo das Fenster nicht scrollt).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Regel gilt für alle Fenster über das gemeinsame Gerüst (`dialog.sheet` und `.vdlg`), nicht über 209 einzelne Umbauten. Fenster mit anderem Fuss (`.acts`, `.foot`, eigene Zeilen) behalten ihren Fuss, scrollen aber mit weichem Rand; sie wechseln auf `.vd-foot`, wenn ihr Besitzer sie umbaut.
- Ein scrollendes Fenster darf unten eine halbe Zeile zeigen (der weiche Rand sagt «mehr»); ein Fenster, das nicht scrollt, darf nichts angeschnitten zeigen; der Hauptknopf ist immer ganz da.
- Zusätzliche Grösse 1440×700 im Wächter: Noahs echtes Browserfenster am Mac ist mit den Leisten des Browsers rund 1470×710.
- Die zwei runden Schwebeknöpfe am rechten Rand auf Noahs Bildern kommen nicht aus der App (keine festen Elemente am rechten Rand), sondern aus Browser-Erweiterungen.

## Entscheide (eigene Datei `docs/decisions/nie-abgeschnitten.md`)
- 24.11.2026: Regel «Nie abgeschnitten» (Noah «a und b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Mach das Browserfenster niedrig (rund 700 px) und öffne «+ Neu» › «Velo hinzufügen»: Titel oben, Knöpfe unten, ein weicher Rand zeigt, dass es weitergeht.
2. Öffne den Abend-Check auf Heute: «Speichern» steht unten und ist ganz sichtbar.
