# Flyer: A5 für den Druck

PR folgt · 10.11.2026 · Auftrag: Noah «gerne» (Antwort auf «b: A5 für den Druck fest in die App», Thread «Landing Page für Tennis-Flyer planen»)

## Was ist neu
- Im Flyer (Tennis › Flyer, Teil «Sprache und Format») gibt es das Format «A5 für den Druck». Es ist ausgeschaltet, bis Noah es einschaltet.
- «Speichern» macht daraus ein PDF mit einer Seite: A5 hoch bei 300 dpi plus 3 mm Beschnitt an jeder Seite (154 × 216 mm, 1818 × 2550 Bildpunkte). Das PDF kennt seinen Endformat-Rahmen (TrimBox), wie Druckereien es brauchen.
- Der Beschnitt entsteht, indem die Randpixel des fertigen A5-Flyers nach aussen wiederholt werden. Das Layout ist dasselbe wie beim A5-Muster, das Noah schon gesehen hat; der Rand zum Schnitt bleibt mehr als 8 mm.

## Was fällt weg oder rutscht tiefer
- nichts. Die drei bisherigen Formate und ihre Dateien bleiben gleich; neue Flyer starten wie vorher mit 16:9, A4 und Quadrat.

## Selbst entschieden
- PDF statt PNG, weil Online-Druckereien meist ein PDF verlangen. Das PDF ist ein JPEG (Qualität 95) in einer PDF-Seite, ohne Bibliothek (`src/lib/booking/flyerpdf.js`). Der Flyer ist ein Bild, ein PDF mit Schrift als Text ist nicht nötig.
- Kein Ausdruck auf Papier aus der App und keine Kontaktzeile: wie im Muster fehlen Telefon und Adresse, weil Noah sie nicht auf dem Flyer will.
- Standardmässig aus: wer nie druckt, sieht keine neue Datei beim Speichern.
- Das Teilen schickt dasselbe PDF mit seinem eigenen Typ.
- Die Einstellung liegt im bestehenden Flyer-Eintrag (`formats`); kein Schema- und kein Backup-Format-Wechsel.
- Kein neuer Eintrag in `features.js`: ein weiteres Format im bestehenden Flyer.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Tennis-Flyer: A5-Druckdatei aus der App. Danach bestellt Noah 100 Stück bei einer Schweizer Online-Druckerei.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Tennis › Flyer, Teil «Sprache und Format»: «A5 für den Druck» einschalten. Die Vorschau zeigt das Format etwas grösser als A5 (mit Beschnitt).
2. «Speichern»: neben den Bildern kommt ein PDF mit «a5» im Namen.
3. PDF öffnen: eine Seite, der grüne Anmeldeband und der QR-Code füllen die Breite bis zum Rand.
