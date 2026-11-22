# Foto der Seite im Verbesserungs-Logbuch

21.11.2026 · Auftrag: Noah «2b», Karte «Ja, html-to-image einbauen» (21.11. 21:26), «ist ein scrolling screenshot möglich» (21.11. 23:02)

- Neue Abhängigkeit `html-to-image` (MIT) ist erlaubt. Sie lädt erst beim Foto, der Kern bleibt unter 3 MB.
- Das Foto zeigt die ganze Seite, auch den Teil, den man erst durch Scrollen sieht (höchstens 6000 Pixel hoch). Klappt das nicht, macht die App das Bild des Bildschirms. Verworfen: nur der sichtbare Teil.
- Ein Foto ist etwa 150 bis 300 KB gross, höchstens 700 KB; alle Fotos des Logbuchs zusammen höchstens 40 MB. Darüber wird der Eintrag ohne Foto gespeichert und sagt «Foto nicht möglich».
- Die Fotos bleiben auf dem Gerät und im Backup, nie im Repo; Tests nur mit erfundenen Daten.
