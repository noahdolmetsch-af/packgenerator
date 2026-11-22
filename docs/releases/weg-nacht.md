# Weg zum Ziel: Nachtplan

PR # · 07.11.2026 · Auftrag: Noah «b» (Thread «Planen: Nachtplan im Weg», 05.11.2026) und «Schrittarten 1 2 3 4 5 7 8, je eigener Thread» (Thread «Entwerfen Weg zum grossen Ziel»)

## Was ist neu
- Nichts Sichtbares. Die Schrittart «Nachtplan» (Typ `nacht`) ist fertig und in der Liste der Schrittarten eingetragen; die Seite «Weg zum Ziel» (K2) zeigt sie, sobald sie da ist.
- `src/lib/weg/types/nacht.js`: bei einem Rennen mit Tour vier Schritte: «Für jede Nacht entscheiden, wo du schläfst» (28 Tage vor dem Start, Link zum Plan des Rennens), «Die Betten buchen, die du brauchst» (21), «Die Betten entlang der Strecke ansehen» (14, Link zu Entlang der Strecke), «Eine Nacht durchspielen» (10, Link zum Rennen-Check). Bei jedem anderen Ziel, auch einem freien: «Deine Nächte aufschreiben» und «Betten buchen».
- Abhaken von selbst: «Für jede Nacht entscheiden …» wird abgehakt, wenn jede Nacht des Rennens eine eigene Wahl hat (Touren › Rennen › Plan: Bivy, Hotel oder durchfahren). Solange Nächte offen sind, bleibt er offen. Alle anderen Schritte hakst du selbst ab.
- Nächte von Hand (Noah «b»): bei freien Zielen und überall ohne Renndaten führt der Schritt eine Liste von Nächten (Ort und Notiz), die du ergänzen, umbenennen, löschen und mit Pfeilen oder Ziehen ordnen kannst (`addNight`, `editNight`, `removeNight`, `moveNight`). Sie liegen im Schritt, also im Einstellungs-Eintrag `weg`: im Backup und im Abgleich, keine neue Tabelle.
- `load(db)` liest Rennen und Touren für das Abhaken; die Seite legt das Ergebnis unter `ctx.nacht` ab.
- `src/lib/i18n/de/weg-nacht.js`: alle deutschen Texte. `tests/weg-nacht.test.js`: Tests.

## Was fällt weg oder rutscht tiefer
- nichts (keine Oberfläche)

## Selbst entschieden
- Keine «Was ist neu»-Datei, keine neue Funktion in `features.js` und keine Änderung an `docs/app-stand.md`: es gibt noch keine Seite, und die Zeile «Weg zum Ziel» gehört dem Seiten-Thread. Die Fertig-Regel kommt mit der Seite (K2).
- Der selbst abhakende Schritt wird über ein Feld `key: 'decide'` im Schritt erkannt, nicht über seinen Titel, damit Umbenennen ihn nicht kaputt macht. `templateOf` (weg.js) lässt dieses Feld bisher weg: ein als Vorlage gespeicherter Weg verliert dort das Abhaken von selbst. Das gehört in den Kern, nicht in diesen PR.
- Bei freien Zielen hakt nichts von selbst ab: die App kann nicht wissen, wie viele Nächte du brauchst. Der Haken ist deiner.
- Die Zahl der Nächte eines Rennens ist die Zahl der Tage der Tour minus eins; kennt die Seite den Plan genauer, gibt sie `ctx.nightCounts` mit. Nur eigene Wahlen zählen: ein Rennen, in dem du nichts angefasst hast, bleibt «offen».
- Das Zelten oder Schlafen an einem Ort wird nie als erlaubt bezeichnet; der Schritt sammelt nur deine Wahl (wie in `src/lib/race/sleep.js`).

## Entscheide (für decisions.md)
- 05.11.2026: Der Nachtplan-Schritt gilt auch für freie Ziele; dort trägt man die Nächte von Hand ein, bei Rennen kommen sie aus der Schlafstrategie (Noah «b»). Keine neue Entscheidung in diesem PR.

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G «Rückwärts-Plan zu einem grossen Ziel»: Schrittart «Nachtplan» gebaut, Seite folgt (K2). `docs/vorhaben.md` und `docs/roadmap.md` ändern sich erst mit der Seite.

## Prüfschritte
Nichts zu prüfen auf der Seite. Die Tests laufen auf GitHub (build, e2e desktop).
