# Weg zum Ziel: Schrittart «Rennplanung»

PR # · 07.11.2026 · Auftrag: Noah «a» vom 05.11.2026 (Thread «Planen: Rennplanung im Weg», gebaut im Thread «Bauen: Weg zum Ziel Rennplanung»)

## Was ist neu
- Nichts Sichtbares. Die Seite «Weg zum Ziel» (K2) zeigt die Schrittart automatisch, sobald sie in der Liste `TYPES` steht.
- `src/lib/weg/types/rennplanung.js`: vier Schritte für ein Rennen, die auf den bestehenden **Rennen-Check** zeigen (`#/racecheck/<Rennen>`) und sich von selbst abhaken, wenn das passende Blatt ausgefüllt ist:
  - **Schlaf entscheiden** (56 Tage vor dem Start): Haken, wenn Blatt 4 «Schlaf» eine Antwort hat.
  - **Basisliste prüfen** (42 Tage): Haken, wenn Blatt 3 «Grundliste» eine Antwort hat.
  - **Zielsetup packen** (35 Tage): Haken, wenn mindestens eine Tasche ein Gewicht hat (Blatt 2).
  - **Tag vorher durchgehen** (1 Tag): Haken, wenn alle Punkte von Blatt 6 abgehakt sind.
- Der Streifen «x von 4 geregelt» zählt diese vier Schritte (`typeProgress(goal, 'rennplanung', …)`).
- Eine Zeile in `src/lib/weg/types/index.js`, deutsche Texte in `src/lib/i18n/de/weg-rennplanung.js`, 14 Tests in `tests/weg-rennplanung.test.js`.

## Was fällt weg oder rutscht tiefer
- nichts (keine Oberfläche)

## Selbst entschieden
- Schnittstelle zur Seite: die Seite reicht `ctx.races` (der Einstellungs-Eintrag der Rennen, `racesOf(...)`) an `applyAuto` weiter; das Ziel kennt sein Rennen über `goal.tripId`. Ohne Tour oder ohne gespeichertes Rennen bleibt alles offen, nichts hakt sich ab.
- Jeder Schritt trägt ein Feld `key` (`setup`, `liste`, `schlaf`, `vorher`). Es bleibt, wenn Noah den Schritt umbenennt oder verschiebt, darum hakt er weiter ab. Ein Schritt ohne bekannten `key` hakt sich nie von selbst ab.
- Die vier Schritte werden nur für Ziele der Art «Rennen» vorgeschlagen. Bei «Tour» und «frei» ist die Liste leer; die Schrittart lässt sich dort von Hand hinzufügen.
- Tage vor dem Start (56, 42, 35, 1) aus dem Check abgeleitet («Ab 5 Wochen vor dem Start nichts Neues», Probefahrt ab 3 Wochen). Alle änderbar, jeder Schritt hat einen eigenen Tag, Namen, Löschen und Ordnen wie überall in `weg.js`.
- «Basisliste» und «Schlaf» gelten als geregelt, sobald eine Antwort auf dem Blatt steht; wie vollständig sie ist, bestimmt Noah.
- Kein Eintrag in `features.js`, keine «Was ist neu»-Datei: es gibt noch keine Seite. Die Fertig-Regel (Seite, Absprung, Gut zu wissen, Leere Ansicht, Als Nächstes) kommt mit K2.
- Beim Speichern eines Wegs als Vorlage (`templateOf` in `weg.js`) geht das Feld `key` heute verloren; die Schritte würden dann nicht mehr abhaken. Das gehört in einen kleinen Fix an `templateOf` (Feld `key` mitnehmen), nicht in diesen PR.

## Entscheide (für decisions.md)
- 05.11.2026: Rennplanung im Weg = vier Schritte, die auf den Rennen-Check zeigen (Noah «a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G «Weg zum Ziel»: Schrittart «Rennplanung» gebaut, sichtbar mit der Seite (K2). `docs/vorhaben.md` und `docs/roadmap.md` ändern sich nicht.

## Prüfschritte
Nichts zu prüfen auf der Seite. Die Tests laufen auf GitHub (build, e2e desktop).
