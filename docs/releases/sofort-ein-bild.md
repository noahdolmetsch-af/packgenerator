# Sofort ein Bild

Auftrag: Noah «Mach die App 5 mal schneller» (Thread «App fünfmal schneller machen», 23.11.2026). Schritt 1 von mehreren kleinen PRs.

## Was ist neu
- `index.html` zeigt beim Start sofort ein ruhiges Gerüst von Heute (Logo, Balken, Karten, unten die Reiter; am Computer links die Seitenleiste) in den Farben der gewählten Farbwelt, hell oder dunkel. Vorher war der Bildschirm leer, bis über 300 Dateien (rund 6 MB entpackt, davon 2.7 MB deutsche Texte) geladen und ausgeführt waren.
- Die Farben stehen nicht ein zweites Mal im Code: `scripts/boot-shell.mjs` liest sie beim Bauen aus `src/app.css` (alle sieben Farbwelten, hell und dunkel) und legt sie samt Layout (`scripts/boot-frame.css`) als `<style>` in `index.html`. Kein zusätzlicher Dateiabruf.
- Ein kurzes Skript in `index.html` wählt Farbwelt und Hell/Dunkel nach derselben Regel wie `initTheme` (`src/lib/theme.svelte.js`). `src/start.js` nimmt das Gerüst weg, sobald die App gezeichnet ist (`#boot`). Als Sicherung blendet das Gerüst sich nach 15 s selbst aus, und `watchWhitePage` (`src/lib/ui/whitepage.js`) nimmt es weg, bevor es die Meldung «Etwas ist schiefgelaufen» zeigt, damit sie nie darunter versteckt bleibt.
- Tempo-Messer (Ich › Daten): neue Angabe «Inhalt da» (grösster Inhalt, `largest-contentful-paint`). Weil «Start» jetzt das Gerüst zeigt und kurz ist, sagt «Inhalt da», wann der echte Inhalt von Heute stand.
- Neue Tests: `tests/boot-shell.test.js` (Farben aus `app.css`, alle Farbwelten, Wahl von Farbwelt und Hell/Dunkel, Gerüst ohne Text ausser Logo und ohne Orientierungspunkt, Entfernen nach dem Zeichnen), `tests/tempo-messer.test.js` angepasst.

## Gemessen (Handy-Ansicht 390 px, Mittelwert aus 5 bis 6 Läufen; Daten: 700 erfundene Teile, 30 Touren, App schon einmal gestartet; 4× gebremster Prozessor wie auf Noahs Handy)
| | vorher | nachher |
|---|---|---|
| Start (erstes Bild), ohne Bremse | 772 ms | 60 ms |
| Start (erstes Bild), 4× gebremst | 2020 ms | 144 ms |
| Inhalt da (grösster Inhalt), ohne Bremse | 1150 ms | 1268 ms |
| Inhalt da (grösster Inhalt), 4× gebremst | 3792 ms | 3836 ms |
| Gebremst in den ersten 8 s, 4× gebremst | 1276 ms | 1155 ms |

Ehrlich gelesen: Der erste Eindruck kommt gut zehnmal früher. Der echte Inhalt von Heute kommt dadurch **nicht** früher (die kleinen Unterschiede liegen im Messrauschen); das sind die nächsten Schritte (siehe unten).

## Was fällt weg oder rutscht tiefer
- nichts. Die App selbst ist unverändert; das Gerüst steht nur, bis sie gezeichnet ist.

## Selbst entschieden
- Das Gerüst enthält als einzigen Text das Logo «PG» und am Computer «Pack Generator» (die Marke, in beiden Sprachen gleich). Alles andere sind Formen, damit nichts übersetzt werden muss und nichts Falsches steht. Ohne Text zählt der Browser kein «erstes Bild»; das Logo ist echter Inhalt der App.
- Das Gerüst ist ein eigener Block in `index.html` ausserhalb von `#app`, mit `aria-hidden`, ohne `main`, Überschrift oder Knopf: Bildschirmleser und Tests sehen es nicht.
- Die kleinen Zusatz-Apps (`apps/*/index.html`) bekommen das Gerüst nicht; `start.js` entfernt es nur, wenn es da ist.
- Layout-CSS liegt in `scripts/`, nicht in `src/`: Das Gerüst läuft vor `app.css` und kann dessen Grössen-Variablen nicht benutzen (der Stil-Wächter erlaubt in `src/` keine festen Werte).

## Entscheide (eigene Datei `docs/decisions/start-schneller.md`)
- 23.11.2026: «5× schneller» wird in zwei Zahlen gemessen: Start (erstes Bild) und Inhalt da.

## Stand im Plan
- Tempo: Schritt 1 (Gerüst). Offen: Datenbank-Abfragen beim Start bündeln (617 in 3 s, 223 für Einstellungen), weniger Code beim Start laden (über 300 Dateien).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. App ganz schliessen, neu öffnen: zuerst ein ruhiges Gerüst in deinen Farben, dann füllt sich Heute.
2. In den Einstellungen auf dunkel stellen, neu öffnen: das Gerüst ist dunkel, kein weisses Aufblitzen.
3. Ich › Daten › Tempo-Messer einschalten, App neu laden, Zeile kopieren: «Start» ist kurz, «Inhalt da» zeigt den echten Inhalt.
