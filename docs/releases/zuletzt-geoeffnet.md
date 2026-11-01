# Zuletzt geöffnet in Quick Links

PR (Quick Links, Schritt 4 von 8) · 28.10.2026 · Auftrag: Noah «6a» (zuletzt geöffnet), «7a» (Anpinnen vorschlagen), «20: 30 Tage nicht geöffnet» (Thread «Quick Links»)

## Was ist neu
- Quick Links zeigt «Zuletzt geöffnet»: die letzten 5 Seiten dieses Geräts, jede mit «Anpinnen» (`src/lib/quick/usage.js`, gezählt in `PinMarks.svelte`).
- Eine Seite, die du an 3 verschiedenen Tagen in 14 Tagen öffnest, kommt oben als Vorschlag «Hier anpinnen?» mit «Nein, danke» (gilt 30 Tage).
- Ein Pin, den du 30 Tage nicht geöffnet hast, kommt einzeln mit «Lösen» (mit Rückgängig) oder «Behalten» (fragt 30 Tage nicht mehr).
- Pins merken sich ihren Tag (`at`), damit ein neuer Pin nicht gleich als alt gilt.

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Heute und Quick Links selbst zählen nicht als «geöffnet».
- Ein Pin gilt als geöffnet, wenn du ihn in Quick Links antippst oder seine Seite sonst öffnest.
- Immer nur ein Vorschlag und ein Aufräum-Hinweis aufs Mal, damit die Seite ruhig bleibt.
- Gezählt wird pro Gerät, wie die Pins.

## Entscheide (für decisions.md)
- 28.10.2026: Quick Links zählt geöffnete Seiten pro Gerät; Vorschlag ab 3 Tagen in 14 Tagen; Aufräumen nach 30 Tagen, nie ohne Tipp.

## Stand im Plan (roadmap.md / vorhaben.md)
- Quick Links: Schritt 4 mit diesem PR. Es folgen: 5 Werte und Punkt, 6 Passend zum Moment, 7 Top 4 auf Heute, 8 Suche, `g q`, App-Symbol-Kurzbefehle.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen, dann Quick Links: «Zuletzt geöffnet» zeigt Touren.
2. Daneben «Anpinnen» antippen: Touren steht in der ersten Gruppe.
