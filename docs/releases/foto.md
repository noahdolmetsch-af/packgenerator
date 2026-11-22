# Foto der Seite (Logbuch, Schritt 3 von 4)

21.11.2026 · Auftrag: Noah «freigabe», «2b» (Foto immer, ohne Schalter); «Ja, html-to-image einbauen» (Karte 21.11. 21:26); Thread «Neue Verbesserungen finden», Umsetzungsauftrag L3

## Was ist neu
- Mit dem Tipp auf den Block (Knopf «Verbessern») macht die App ein **Foto der ganzen Seite**, auch des Teils, den man erst durch Scrollen sieht (bis 6000 Pixel Höhe), der gewählte Block **orange umrandet**. Band, Knopf und Fenster von «Verbessern» sind nicht auf dem Foto.
- Das Foto ist ein kleines JPEG (Ziel 150–300 KB, höchstens 700 KB; eine lange Handy-Seite wie «Ich» ist etwa 150 KB), liegt am Eintrag auf dem Gerät und im Backup, nie im Geräteabgleich und nie im Repo.
- Im Fenster zeigt ein kleines Bild das Foto, im Logbuch beim Eintrag ebenfalls; ein Tipp zeigt es gross, hoch und zum Hoch- und Runterschieben. «Bilder speichern» (Schritt 4) speichert die Fotos mit ihrer Nummer als Dateien (am Handy über das Teilen-Fenster).
- Wenn es nicht klappt, steht beim Eintrag «Foto nicht möglich»; der Eintrag wird trotzdem gespeichert.
- Neue Abhängigkeit `html-to-image` (MIT, 1.11.13). Sie lädt erst beim Foto (`await import()`), der Kern bleibt unter 3 MB.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Obergrenze: alle Fotos des Logbuchs zusammen höchstens 40 MB. Darüber werden neue Einträge ohne Foto gespeichert und sagen «Foto nicht möglich». Noah kann ältere Einträge löschen. Mit den längeren Fotos reicht das für gut 130 Einträge.
- Bei einer Seite, die länger ist als der Bildschirm, fehlen Leisten, die am Bildschirm festkleben (zum Beispiel oben), weil sie im Foto am falschen Ort stünden. Ist die Seite höher als 6000 Pixel, wird sie dort abgeschnitten. Listen, die in sich scrollen, sind nur mit dem sichtbaren Teil auf dem Foto. Klappt das lange Foto nicht, macht die App das Bild des Bildschirms. Seite, Block und Uhrzeit stehen trotzdem am Eintrag.
- Karten, einzelne Diagramme und Zeichnungen können leer sein (bekannt, so entschieden).
- Das Foto wird vor dem Öffnen des Fensters gemacht (ca. 0,3 bis 2 Sekunden, das Band sagt «Das Foto der Seite wird gemacht»).
- Browser-Test mit der App ohne eigene Daten (fiktiv); echte Werte kommen nie in Tests oder ins Repo.

## Entscheide
- siehe `docs/decisions/foto.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Verbesserungs-Logbuch: Schritt 3 von 4 gebaut (Ziel 1 «Eine App, die mich im Alltag unterstützt»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Verbessern» tippen, einen Block antippen: das Fenster zeigt ein kleines Foto, «Speichern».
2. Ich › Verbesserungs-Logbuch: beim Eintrag steht das Bild mit orangem Block; Tipp darauf zeigt es gross.
3. «Bilder speichern» tippen: die Datei `logbuch-01-….jpg` landet auf dem Gerät.
