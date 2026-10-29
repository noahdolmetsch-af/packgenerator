# Freunde zu Strava einladen

PR #? · 27.10.2026 · Auftrag: Noah «ich möchte jetzt bauen, dass wir in zukunft jederzeit umstellen können», Vorschlag ★ 1a 2a 3a, Noah «ok 335» (Thread «Geräte und Datenquellen»)

## Was ist neu
- Velo › Pflege › Strava (nur auf Noahs Geräten): neuer Teil **«Freunde mit eigenem Strava»**.
- «Freund einladen» macht einen Link. Er gilt **einmal** und **7 Tage**. Der Freund öffnet ihn auf seinem Handy und verbindet sein eigenes Strava. Danach steht er in der Liste.
- Jeder Freund hat «Entfernen». Die App fragt zuerst und bietet 4 Sekunden «Rückgängig» an. Danach löscht der Server seine Strava- und Fitbit-Zugänge und trennt alle seine Geräte.
- Neben dem Link steht der Hinweis, dass Strava eine neue App zuerst nur eine Person verbinden lässt (gratis Antrag bei Strava), mit Link zur Anleitung.
- Auf dem Handy des Freundes: «Du wurdest eingeladen» über «Mit Strava verbinden». Ein abgelaufener Link sagt «schon gebraucht oder älter als 7 Tage».
- Server (`api/strava.js`): Schritte `invite`, `friends` und `friend-remove`. Freunde liegen in `strava:athletes`, zusätzlich zur Vercel-Liste `STRAVA_ATHLETES`, die weiter gilt.

## Was fällt weg oder rutscht tiefer
- nichts. Der neue Teil steht in der Seitenspalte über «Mehr».

## Selbst entschieden
- Den Teil sieht nur ein Gerät von Noah. Ein Freundes-Gerät bekommt die Liste nicht (401).
- Ein Freund aus der Vercel-Liste steht mit «steht auch in Vercel» in der Liste. Nach «Entfernen» kann er sich wieder verbinden, bis Noah ihn in Vercel streicht.
- Der Server merkt sich vom Freund nur den Strava-Vornamen und das Datum. Beides bleibt auf dem Server und kommt nie ins Repo.

## Entscheide (für decisions.md)
- 27.10.2026, Noah «ok 335» (★ 1a 2a 3a): Freunde werden in der App eingeladen und entfernt, ohne Vercel.

## Stand im Plan (roadmap.md / vorhaben.md)
- Geräte und Datenquellen: Umstellen jederzeit möglich. Offen: Apple-Trainings in die Aktiv-Liste und Garmin mit eigenem Schlüssel (wartet auf Noah).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velo › Pflege › Strava: Unter «Freunde mit eigenem Strava» steht «Nur du bist verbunden».
2. «Freund einladen» tippen: Ein Link erscheint mit «Link kopieren» und dem Strava-Hinweis.
3. (Kein echter Freund nötig.) Den Link nicht weitergeben. Er verfällt nach 7 Tagen von selbst.
