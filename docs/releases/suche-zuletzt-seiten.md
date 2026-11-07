# Zuletzt geöffnet in der Suche

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «7a» (Ideen-Doc «Ideen für alle Bereiche», Teil 7 «Oben in der App»; Thread «Bauen: Quick Links 6a und Oben 7a»)

## Was ist neu
- Öffnet man die Suche, steht unter dem leeren Feld zuerst «Zuletzt geöffnet»: die letzten fünf Seiten dieses Geräts, ein Tippen öffnet die Seite und schliesst die Suche (`src/lib/nav/Search.svelte`, `recentPlaces` in `src/lib/quick/usage.js`).
- Die Seite, auf der man gerade ist, steht nicht in der Liste.
- «Liste vergessen» leert die Liste (und die Zähler für den Anpinn-Vorschlag in Quick Links), mit Rückgängig. Pins und «Nein, danke» bleiben.

## Was fällt weg oder rutscht tiefer
- Nichts. «Befehl ausprobieren» und «Zuletzt gesucht» (Suchwörter) rutschen im leeren Suchfeld um bis zu fünf Zeilen tiefer.

## Selbst entschieden
- Dieselbe Liste wie «Zuletzt geöffnet» in Quick Links (kein zweiter Zähler): pro Gerät, Heute und Quick Links zählen nicht.
- Kein neuer Funktionseintrag: Es ist ein Teil der bestehenden Suche (`f.search`). Das Handbuch-Kapitel der Suche bleibt gleich, «Was ist neu» erklärt es mit Prüfschritten.
- Ein Eintrag lässt sich nicht einzeln löschen; die ganze Liste vergessen genügt (kleine Liste, wächst von allein nach).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Ideen-Doc 05.11.2026: Teil 7a gebaut. 7b (Backup-Erinnerung mit Alter) nicht gewählt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen, dann Velos. Die Suche öffnen (Handy: Lupe oben; Computer: Feld links oder Taste «/»): «Zuletzt geöffnet» nennt Velos und Touren.
2. Eine Seite in der Liste antippen: sie öffnet sich, die Suche schliesst sich.
3. «Liste vergessen» tippen: die Liste ist weg. «Rückgängig» holt sie zurück.
