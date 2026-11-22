# Weg zum Ziel: Schrittart «Bike ready»

PR # · 07.11.2026 · Auftrag: Noah «Schrittarten 1 2 3 4 5 7 8, je eigener Thread» (05.11.2026 20:30, Thread «Bauen: Weg zum Ziel Bike ready»); Vorschlag a/b am 07.11.2026

## Was ist neu
- Nichts Sichtbares. Die Schrittart «Velo bereit» (Typ `velo`) für «Weg zum Ziel»: `src/lib/weg/types/velo.js` und eine Zeile in `types/index.js`. Die Seite folgt mit K2.
- Fünf Vorschläge, rückwärts vom Starttag: das ganze Velo prüfen (6 Wochen vorher), fällige Pflege erledigen (5 Wochen), Kette und Reifen ersetzen, wenn abgenutzt (3 Wochen), Werkzeug und Ersatzteile bereitlegen (2 Wochen), Kurzcheck (2 Tage).
- Haken von selbst, nur wenn die App es schon weiss: Prüfen = fertige Vollinspektion in den 7 Wochen vor dem Start; Pflege = die Velopflege sagt «nichts fällig» (und hat Daten); Kurzcheck = irgendeine fertige Inspektion in den 3 Tagen vor dem Start. Kette/Reifen und Werkzeug hakst du von Hand.
- Welches Velo: das am Schritt, sonst am Ziel, sonst das der Tour des Ziels, sonst das einzige nicht ausgemusterte. Bei zwei Velos ohne Wahl hakt nichts von selbst; die Links führen dann zur Veloliste.
- Links: Velopflege des Velos, Inspektion (voll / kurz), Reparaturset.
- `load(db)` liest nur (Velos, Touren, Inspektionen, Zustand der Velopflege) und legt es für `auto` bereit; die Seite speichert es unter `ctx.velo` und gibt `ctx.today` mit.
- `tests/weg-velo.test.js` (18 Tests, darunter `load` an einer Fake-Datenbank), deutsche Texte `src/lib/i18n/de/weg-velo.js`.

## Was fällt weg oder rutscht tiefer
- nichts (keine Oberfläche)

## Selbst entschieden
- Die Schritte und Tage sind mein Vorschlag (Noah hat nur die Schrittart gewählt); alles ist änderbar und löschbar.
- Keine «Was ist neu»-Datei, keine Zeile in `features.js` und keine Änderung an `docs/app-stand.md`: es gibt noch keine Seite und keine neue Funktion; die Zeile «Weg zum Ziel» gehört dem Seiten-Thread. Die Fertig-Regel kommt mit der Seite.
- Der Haken für «Pflege» kann sofort gesetzt sein, wenn das Velo schon nichts fällig hat. Das stimmt dann so.

## Entscheide (für decisions.md)
- keine neuen Entscheide.

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G «Rückwärts-Plan zu einem grossen Ziel»: Schrittart «Bike ready» gebaut, sichtbar erst mit der Seite (K2). `docs/vorhaben.md` und `docs/roadmap.md` ändern sich erst mit der Seite.

## Prüfschritte
Nichts zu prüfen auf der Seite. Die Tests laufen auf GitHub (build, e2e desktop).
