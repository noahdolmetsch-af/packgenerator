# Lesbare Zeit bei einer Aktivität

PR #1783 · 17.11.2026 · Auftrag: Noah «alle umsetzen 1-10» (Thread «UI-Test der Seite Flow Training», Fund 9)

## Was ist neu
- Auf der Aktivitätsseite von Training stehen «Zeit verstrichen» und «Pausen» als «1:48:20» und «0:06:00» (vorher «00:01:48:20» und «00:00:06:00»). Ab 24 Stunden bleibt es «01:02:15:00» (Tage:Stunden:Minuten:Sekunden).

## Was fällt weg oder rutscht tiefer
- Die führenden «00:» für Tage bei Zeiten unter einem Tag auf der Aktivitätsseite von Training. Sonst nichts.

## Selbst entschieden
- Dies ändert Noahs Format vom 21.10.2026 («dd:hh:mm:ss») nur unter einem Tag und nur auf der Aktivitätsseite von Training. Ab einem Tag gilt es unverändert; Touren, Rückblick und Strava-Übersicht bleiben wie sie sind. Will Noah es überall so, ist das ein eigener kleiner PR.
- Neuer Baustein `hmsOrDays` neben `dhms` (`src/lib/touren/strava/fmt.js`), mit Test.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Training › Aktivitäten: eine Aktivität öffnen.
2. «Zeit verstrichen» zeigt z. B. «1:48:20», ohne «00:» davor.
