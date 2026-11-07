# Weg zum Ziel: Schrittart «Packen testen»

PR # · 07.11.2026 · Auftrag: Noah «a» (Thread «Planen: Packen testen im Weg», 05.11.2026 20:36)

## Was ist neu
- Nichts Sichtbares. Die Schrittart «Packen testen» für «Weg zum Ziel» ist als Logik gebaut (`src/lib/weg/types/packen.js`, eine Zeile in `types/index.js`). Die Seite folgt als K2.
- Drei Schritte mit festem Abstand zum Start, alle nur Vorschläge (umbenennen, verschieben, löschen, von Hand abhaken):
  - **Eine Nacht draussen mit dem Material schlafen**, 21 Tage vor dem Start, Haken von Hand.
  - **Einmal packen wie echt und wägen**, 14 Tage vor dem Start, Haken von Hand, Link zu Packen (dort steht das Gesamtgewicht).
  - **Generalprobe zu Hause**, 7 Tage vor dem Start, Link zur Generalprobe der Tour.
- Haken von selbst: die Generalprobe ist abgehakt, sobald die Generalprobe der Tour (`trip.probe`) fertig ist, also jeder Schritt beantwortet und mindestens einer davon von dir. Was die App allein beantworten konnte (Backup frisch, Route offline gesichert), zählt nicht als gemacht. Ein Haken, den du zurücknimmst, wird nie wieder von selbst gesetzt.
- Die Tour zum Ziel: die gewählte Tour des Ziels (`tripId`), sonst die Tour, die am Starttag des Ziels beginnt.
- `load(db)` liest die Touren für den Haken von selbst; die Seite legt sie unter `ctx.packen` ab.
- `tests/weg-packen.test.js`: 12 Tests (Vorschläge und Tage, Tour finden, Haken von selbst und seine Grenzen, Links, Deutsch).
- Deutsche Texte: `src/lib/i18n/de/weg-packen.js`.

## Was fällt weg oder rutscht tiefer
- nichts (keine Oberfläche)

## Selbst entschieden
- Keine «Was ist neu»-Datei, kein Eintrag in `features.js` und keine Änderung an `docs/app-stand.md`: es gibt noch keine Seite, und die Zeile «Weg zum Ziel» gehört dem Seiten-Thread. Die Fertig-Regel (Seite, Absprung, Gut zu wissen, Leere Ansicht, Als Nächstes, eigene Zeile im App-Stand) kommt mit der Seite (K2).
- «Einmal packen wie echt» bekommt keinen Haken von selbst: Noah hat nur die Generalprobe als automatisch genannt; die App weiss nicht sicher, ob einmal probegepackt wurde.
- Ein Schritt trägt ein Feld `key` (`night`, `probe`, `dress`), damit der Haken von selbst auch nach dem Umbenennen den richtigen Schritt trifft.
- Eine Generalprobe, die nur die App beantwortet hat, gilt nicht als gemacht (sonst wäre der Haken schon da, ohne dass du etwas getan hast).
- Der Link «Generalprobe» führt direkt zur Tour, wenn das Ziel eine Tour gewählt hat; sonst zu Packen.

## Entscheide (für decisions.md)
- 05.11.2026: Schrittart «Packen testen» mit drei Schritten (Nacht draussen 21, Packprobe 14, Generalprobe 7 Tage vor dem Start), Generalprobe hakt sich aus `trip.probe`, alles änderbar (Noah «a»). Steht schon in der Entscheidung; keine neue Zeile nötig.

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G «Weg zum Ziel»: Schrittart «Packen testen» gebaut (Logik), Seite folgt als K2. `docs/vorhaben.md` und `docs/roadmap.md` ändern sich erst mit der Seite.

## Prüfschritte
Nichts zu prüfen auf der Seite. Die Tests laufen auf GitHub (build, e2e desktop).
