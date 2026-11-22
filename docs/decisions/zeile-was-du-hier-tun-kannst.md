# Die Zeile «Was du hier tun kannst» bleibt, immer zugeklappt

22.11.2026 · Auftrag: Noah «so lassen - immer zugeklappt» (Frage des Bilanz-Threads: «hast du heute dreimal verschieden entschieden»)

- Die Zeile «Was du hier tun kannst» bleibt auf **allen** Seiten, die sie haben (`ON_PAGES` in `src/lib/seiteninhalt.js`), und ist **immer zugeklappt**. Sie ist eine Zeile hinter dem Seitentitel; ein Tipp öffnet das Fenster hinter dem «?» (Grund: Noah will sie so; verworfen: sie fällt weg, eine eigene Zeile «Hilfe zu dieser Seite»).
- Das gilt vor allen früheren Aussagen vom 21.11.2026 und ersetzt «2a» der Seitenregeln («1-5a», 06:27 UTC: die Zeile fällt weg, Hilfe nur über das «?»). Regel 3 in `docs/design-audit.md` ist angepasst.
- Das Tagebuch hatte die Zeile über `LINE_OFF` verloren (#1336). Sie kommt zurück, `LINE_OFF` fällt weg (22.11.2026, `docs/releases/tagebuch-hilfezeile.md`).
