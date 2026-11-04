# Regenstreifen und zwei Fenster auf der Wetterseite

PR · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4b» (Thread «Plane die Wetterseite neu»)

## Was ist neu
- Unten auf der Wetterseite (Ich › Wetter) der **Regenstreifen**: eine Säule pro Stunde für die nächsten 24 Stunden, mit einer Zeile wie «Regen ab etwa 16:00. Am stärksten gegen 18:00.» Er kommt aus den Wetterdaten der Seite und geht immer, auch wenn eine fremde Seite sich nicht einblenden lässt.
- Zwei **Fenster**: «Landi-Regenradar» und «SRF-Meteo-Webcams». Sie sind zu, bis man sie antippt; erst dann lädt die fremde Seite. Darunter immer «In neuem Tab öffnen».
- Bleibt ein Fenster leer (viele Seiten verbieten das Einblenden, die App kann das nicht erkennen), schaltet «Bleibt leer? Nur den Knopf zeigen» es auf diesem Gerät aus. «Fenster nochmals versuchen» holt es zurück.

## Was fällt weg oder rutscht tiefer
- nichts. Der Landi-Knopf in «Heute» bleibt wie er war.

## Selbst entschieden
- Fenster zu und erst beim Antippen laden: sonst würde jede Wetterseite zwei fremde Seiten laden (Daten, Tempo, Datenschutz).
- Die Einstellung «Fenster aus» (`wxFramesOff`) liegt in den Einstellungen und läuft mit dem Abgleich mit; sie enthält nur die Namen der Fenster.
- Teil der bestehenden Funktion «Wetter für die Fahrt» (`f.weather`), keine neue Funktion; darum kein neuer Eintrag in `features.js`, `FEATURE_MOMENTS` und «Passt hier». Die Zeile in `docs/app-stand.md` ist ergänzt.
- Ob Landi und SRF das Einblenden erlauben, war von der Entwicklungsumgebung aus nicht prüfbar (beide Adressen gesperrt). Darum der Rückfall.
- Die Fenster stehen unten (Noah «4b»). Mit den Reitern (nächster PR) ziehen sie nach «Radar und Kameras».

## Entscheide (für decisions.md)
- 04.11.2026: Fenster für Landi-Radar und SRF-Webcams, mit Rückfall auf Neuer Tab (Noah «1a», «3a»); eigener Regenstreifen 24 h (Noah «2a»); Platz unten (Noah «4b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetterseite neu: PR 1 von 4 (Regen und Fenster). Danach Reiter, Gewitter-Hinweis mit Uhrzeit, Sonnenauf-/untergang und Licht.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Wetter öffnen, nach unten scrollen: «Regen in den nächsten 24 Stunden» mit Säulen und einer Zeile.
2. «Landi-Regenradar» antippen: das Fenster öffnet sich. Bleibt es leer: «In neuem Tab öffnen» oder «Bleibt leer? Nur den Knopf zeigen».
3. «SRF-Meteo-Webcams» genauso.
