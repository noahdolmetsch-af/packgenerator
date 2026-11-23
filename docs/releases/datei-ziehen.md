# Datei auf das Fenster ziehen

Auftrag: Noah «1a 2a 3a 4a 5a» vom 23.11.2026 (Thread «Papierkorb, Tab-Titel und Ziehen bauen»), Punkt 3. Ziel: Auffindbarkeit (die Datei findet selbst den Weg, nur am Computer).

## Was ist neu
- Am Computer: eine Datei über das Fenster der App ziehen zeigt «Loslassen zum Öffnen».
- Beim Loslassen fragt ein Blatt «Was soll mit dieser Datei geschehen?», nennt die erkannte Art (aufgezeichnete Fahrt, geplante Strecke, Backup-Datei, Foto oder PDF) und schlägt einen Weg vor: «Fahrt hochladen», «Als geplante Tour übernehmen», «Backup prüfen», «In Dokumenten ablegen» (bei einem einzelnen Foto oder PDF auch «Nur ansehen»). «Abbrechen» ist voreingestellt und hat den Fokus.
- Dieselbe Weiche wie das Teilen am Handy (`public/share-target.js`): die Datei wartet im selben Zwischenspeicher, dann öffnet sich dieselbe Seite (`#/debrief/ride/shared`, `#/komoot/shared`, `#/me/data?shared=backup`, `#/me/docs/scan?shared=1`). Ein Backup geht durch die bestehende Prüfung («Backup prüfen»), nie still hinein; eine Fahrt wird erst gezeigt, dann gespeichert.
- Das Drop-Feld im Dokumente-Scan behält den Vorrang: nimmt eine Seite die Datei selbst, bleibt diese Ebene still.
- Eine Datei, die die App nicht kennt (Text, Zip): das Blatt sagt es und hat nur «Abbrechen». Mehrere Dateien: Fotos und PDFs zusammen gehen nach Dokumente (bis 30), sonst wird die erste passende genommen und das Blatt sagt, wie viele weggelassen sind.
- In «Hilfe und Funktionen» steht ein Eintrag «Datei auf das Fenster ziehen» (`TRICKS`, `g.dropfile`).

## Was fällt weg oder rutscht tiefer
- nichts. Vorher öffnete eine fallen gelassene Datei im Browser ein neues Fenster oder verliess die App; das ist jetzt der Weg über das Blatt.

## Selbst entschieden
- Nur Computer (Maus mit Zeiger): `(hover: hover) and (pointer: fine)`. Das Handy hat das Teilen-Blatt.
- «An eine Tour hängen» ist kein eigener Knopf: die Seite «Fahrt hochladen» schlägt beim Speichern die Tour desselben Tages schon vor.
- `file_handlers` im Manifest («Öffnen mit») ist nicht dabei; das ist ein eigener PR, sobald Noah es will.
- Kein eigener Eintrag in `features.js` (ein Weg, kein Ort); Handbuch: `TRICKS` in `src/lib/know/gesten.js`, Zeile in `docs/app-stand.md`.
- Die Ebene lädt später (`import()` in `App.svelte`), die Startgrösse wächst nicht.

## Entscheide (eigene Datei `docs/decisions/datei-ziehen.md`)
- 23.11.2026: Datei aufs Fenster ziehen mit Blatt und Vorschlag, «Abbrechen» als Standard (Noah «3a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Ungenutzte Bedienmuster»: Punkt 3 von 4 (Reihenfolge 2 → 4 → 3 → 1).

## Prüfschritte (nach dem Merge auf der echten Seite, am Computer)
1. Eine GPX-Datei aus einem Ordner über das Fenster ziehen: «Loslassen zum Öffnen».
2. Loslassen: das Blatt nennt die Art; «Abbrechen» hat den Fokus; Abbrechen ändert nichts.
3. Nochmal loslassen und «Fahrt hochladen»: die Seite zeigt die Fahrt, gespeichert wird erst dort.
