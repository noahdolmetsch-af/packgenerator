# Mein Tag: «Wann schaffe ich meine 90 Minuten?»

PR # · 25.11.2026 · Auftrag: Noah «1-3» (25.11.2026 00:08, Idee 1 von drei; Thread «Neue Seite «Mein Tag» bauen»)

## Was ist neu
- Läuft die Challenge «Draussen», zeigt «Mein Tag» in der Zeitleiste einen **gestrichelten Block** mit dem besten Fenster für die Minuten, die heute noch fehlen (an einem späteren Tag für das ganze Ziel): frei in deinem Kalender und deinen eigenen Terminen, trocken, vor Sonnenuntergang, auf der Viertelstunde (`src/lib/tag/draussen.js`).
- «Einplanen» legt daraus einen **eigenen Termin** an (gleiche Liste wie «Eintrag hinzufügen»), mit «Rückgängig». Danach schlägt die App für den Tag kein zweites Fenster vor.
- Passt kein volles Fenster, steht eine Zeile über der Zeitleiste: «An diesem Tag ist kein freies, trockenes Fenster von 90 Min. Längstes freies, trockenes Stück: 16:00–16:30.»

## Was fällt weg oder rutscht tiefer
- Nichts. Es kommt ein Block dazu, der nur erscheint, wenn die Challenge läuft, ein Wohnort und Wetter da sind und das Tagesziel offen ist.

## Selbst entschieden
- Wetter und Wohnort wie bei «Draussen-Vorschlag» und «Freie Zeit plus gutes Wetter» (`loadCore`, Einstellung `homePlace`); ohne beides erscheint nichts, kein Hinweis.
- «Trocken» heisst: keine nasse und keine Gewitter-Stunde, mittlere Kosten der Stunden unter 4 (Kälte allein sperrt nicht; es ist ein Draussen-Ziel, kein Velo-Wetter). Das früheste von mehreren gleich guten Fenstern gewinnt.
- Der Termin trägt `ref: outdoor:<Tag>`, damit der Vorschlag für den Tag nach dem Einplanen schweigt. Abhaken zählt weiter in «Draussen» selbst.
- Ein bereits geplanter Draussen-Sport im Trainingsplan zählt noch nicht als erfüllt (das kommt mit Schritt 6).
- Kein neues Feld in der Datenbank, keine Datenänderung.

## Beitrag zu den Zielen und Leitfaden
- Klarheit: aus dem Ziel «90 Minuten» wird ein konkreter Vorschlag mit Uhrzeit, direkt im Tag.
- Auffindbarkeit: das Fenster steht dort, wo man den Tag ansieht, nicht in einer eigenen Karte.
- Leitfaden (`docs/leitfaden.md`): Kalender, Wetter und Ziel kommen an einem Ort zusammen.

## Stand im Plan
- Idee 1 von 3 (Noah «1-3»). Offen: Idee 2 (Abend-Rückblick), Idee 3 (Tagesvorlagen und Wiederholen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Mein Tag» heute öffnen, solange das Ziel offen ist: gestrichelter Block mit Zeit und «Einplanen».
2. «Einplanen» tippen: Block wird dein Termin; «Rückgängig» bringt den Vorschlag zurück.
3. Einen späteren Tag öffnen: das ganze Ziel in einem trockenen, freien Fenster.
