# Bild bearbeiten

PR #(neu) · 28.10.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Screenshot-Werkzeug im Werkzeugkasten»)

## Was ist neu
- Neues Werkzeug Werkzeugkasten › «Bild bearbeiten» (`#/me/tools/markup`): Screenshots oder Fotos wählen (mehrere auf einmal) oder ein Foto machen.
- Pro Seite: drehen, Ränder zuschneiden (gleicher Rahmen wie bei «Fotos»), zeichnen, markieren, Text und Pfeile (gleiches Zeichenfenster wie bei Notizen), entfernen mit Rückgängig.
- Seiten mit Pfeilen oder Ziehen ordnen; am Schluss «Ein PDF» oder «Einzelne Bilder», speichern oder teilen.
- Unten ein Hinweis auf «Dokument fotografieren» für Papier (entzerrt die Seite).

## Was fällt weg oder rutscht tiefer
- nichts. «Fotos», «PDF» und «Dokument fotografieren» bleiben wie sie sind.

## Selbst entschieden
- Eine Seite wird höchstens 2400 Pixel lang (Screenshots bleiben scharf, grosse Kamerafotos werden kleiner); höchstens 30 Seiten auf einmal.
- Die Striche bleiben änderbar, solange die Seite offen ist; nach Drehen oder Zuschneiden beginnt eine neue Zeichnung auf dem neuen Bild.
- Einzelne Bilder gehen zusammen ins Teilen-Menü; wo das nicht geht, wird jedes gespeichert.
- Dateiname `bild-<Datum>.pdf` bzw. `bild-<Datum>-<n>.jpg`.

## Entscheide (für decisions.md)
- 28.10.2026: Screenshot-Werkzeug als eigenes Werkzeug «Bild bearbeiten», «Fotos» bleibt; alle 12 Zusatzfunktionen kommen als kleine PRs nacheinander (Noah «1a 2a 3a 4a 5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Screenshot-Werkzeug: Schritt 1 von 10 (Grundwerkzeug). Danach: Teilen-Menü fragt «Bearbeiten oder Dokument», Schwärzen/Verpixeln/Nummern, Verkleinern/Text kopieren, Zuletzt bearbeitet, Ablegen in Notiz/Tour/Velo, langes Bild, Lupe, Bildschirm aufnehmen, App-Seite festhalten.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Handy einen Screenshot machen, dann Touren › Werkzeugkasten › «Bild bearbeiten» › «Bilder auswählen», zwei Screenshots wählen.
2. Bei Seite 1 auf den Stift tippen, einen Strich zeichnen, sichern; dann aufs Rahmen-Symbol und die Ränder zuschneiden.
3. «Ein PDF» › «Speichern oder teilen»: ein PDF mit 2 Seiten, Strich und Zuschnitt sind drin.
