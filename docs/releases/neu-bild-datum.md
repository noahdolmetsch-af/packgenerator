# «Was ist neu»: Tag, Uhrzeit und Bild

PR #1783 · 23.11.2026 · Auftrag: Noah «1b», «2a und Uhrzeit», «3a», «4a», «5a» (Warteliste 3)

## Was ist neu
- **Datum:** Jeder Eintrag in Ich › Was ist neu zeigt den Tag mit Wochentag und Jahr («Sa., 21. Nov. 2026»), auch die alten. Wo der Zeitpunkt des Merge bekannt ist (alle Einträge seit der Versionsvergabe beim Merge), steht die Uhrzeit dahinter («, 14:32», Zürich). `scripts/news.mjs` liest sie aus dem Commit.
- **Kachel «Neu» auf Heute:** nennt zusätzlich den Tag («… · Sa., 21. Nov.»).
- **Bild:** Ein Eintrag mit Bild hat unter den Punkten den Knopf «Bild zeigen». Erst der Tipp lädt die Datei; «Vorher» und «Nachher» stehen nebeneinander, ein Tipp aufs Bild vergrössert es, «Bild ausblenden» schliesst. Ohne Internet steht «Bild nur mit Internet». Das Bild liegt unter `public/news/<name>.webp` (Vorher: `<name>-vorher.webp`), gleicher Name wie die News-Datei; `scripts/news.mjs` setzt das Feld `image`.
- **Wächter-Test** `tests/news-bild.test.js`: nur `.webp`, gehört zu einer News-Datei, höchstens 40 KB je Bild und 60 KB je Eintrag, ein Vorher-Bild nie ohne Nachher-Bild.
- **Nachgetragen** (nur wo Freigabebilder da sind, Noah «4a»): Tagebuch-Hilfezeile, Draussen abhaken (Vorher und Nachher), Kleiderschrank-Anprobe.

## Was fällt weg oder rutscht tiefer
- nichts. Die Datumszeile ist länger (Wochentag, Jahr), die Kachel hat einen Zusatz.

## Selbst entschieden
- Die Uhrzeit ist die des Merge-Commits, nicht die der Freigabe; Einträge vor der Versionsvergabe beim Merge haben keine.
- Bilder sind 390 breit, höchstens 720 hoch (Handy-Ausschnitt), WebP unter 25 KB.
- Die Bilder liegen nicht im Offline-Speicher (`globPatterns` enthält kein WebP), so wächst der Speicher des Handys nicht.
- Ein eigener Eintrag in `features.js` entfällt: die Seite besteht schon.

## Entscheide (eigene Datei `docs/decisions/neu-bild-datum.md`)
- 22.11.2026: Noah «1b», «2a und Uhrzeit», «3a», «4a», «5a».

## Stand im Plan
- Warteliste 3: gebaut. Weitere alte Bilder können einzeln nachgetragen werden (`public/news/<name>.webp`).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Was ist neu öffnen: jeder Eintrag zeigt den Tag mit Wochentag und Jahr, neuere dazu die Uhrzeit.
2. «Draussen abhaken» suchen, «Bild zeigen» antippen: Vorher und Nachher erscheinen; aufs Bild tippen vergrössert.
3. Auf Heute zeigt die Kachel «Neu» den Tag.

Keine Datenänderung.
