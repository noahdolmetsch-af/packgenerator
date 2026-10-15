# 1. Überblick in 5 Minuten

Stand 14.10.2026. Zurück zur [Übersicht](README.md).

## Was ist der Pack Generator?

Eine persönliche Web-App (PWA) von Noah, die offline funktioniert. Ursprünglich half sie, Velotouren zu planen, zu packen, unterwegs zu begleiten und nachher auszuwerten, dazu Velopflege und Material. Gebaut mit Svelte 5, Vite und Dexie (Speicher im Browser). Live auf GitHub Pages; jeder Pull Request bekommt zusätzlich eine Vorschau auf Vercel. Die Daten bleiben auf dem Gerät; Handy und Computer gleichen sich über eine Backup-Datei ab.

## Die grosse Richtung seit 0.96

1. **Neuer Leitsatz (13.10.2026):** «Eine App, die mich im Alltag unterstützt.» Packen und Touren bleiben wichtig, aber dazu kommen Alltag, Sport, Meditation, Daten über sich selbst und Aufgaben.
2. **Design-Refresh (12.10.2026):** Jede Seite wurde neu gezeichnet und in einer Welle von Releases (0.97 bis 0.110) umgebaut: ruhige Farbwelt «Salbei», Schrift Inter, helle Kopf- und Seitenleiste, weiche Ecken, Schrittleiste für Touren.
3. **Strava ist angeschlossen (0.116, 0.121):** Fahrten kommen mit ihrem Velo in die App und zählen bei Wochen- und Monatswerten mit. Das Training (Pulszonen, Wochenplan, Leistung) ist gebaut, aber noch nicht live.
4. **Viele neue Bereiche sind spezifiziert:** «Wi gaht's?» (eigene Tagesfragen), Meditation zentral mit Timer, Tennis, Inspiration, Velo-Setup, Bezahlfunktion, kleine Apps, Merken (To-dos), Standard-Profil. Mehrere davon sind fertig gebaut und warten im Tagespaket.
5. **Daten einmal aufgeräumt (0.131.0):** Persönliche Daten raus aus dem öffentlichen Code, doppelte Listen zusammengelegt, Altlasten migriert.
6. **Die Arbeitsweise wurde mehrmals geschärft:** Bilder zuerst, Noah gibt frei, Noah merged selbst, ein Release-Paket pro Tag, jede Änderung sagt, was wegfällt.

## Zahlen

| Was | Anzahl |
|---|---|
| Versionen live seit 0.96 | 30 (0.97.0 bis 0.131.2; einige Nummern wurden beim Umnummerieren übersprungen) |
| Offene Pull Requests am 14.10. | 13 (davon 7 gesammelt im Tagespaket #151) |
| Ideen in der Ideen-Sammlung | 103 (36 live, 32 geplant, 28 offen, 4 unklar, 3 bewusst nicht) |
| Freigegebene Bildrunden, noch nicht gebaut | rund 15 (siehe [Dokument 5](05-spezifiziert-und-offen.md)) |

## Wie die Arbeit organisiert ist

- Noah ist kein Entwickler und schreibt Deutsch. Er gibt Wünsche im Projekt-Chat ein.
- Mehrere Claude-Sitzungen arbeiten parallel in **Threads** (je ein Thema). Eine koordinierende Sitzung verteilt Aufgaben und achtet darauf, dass sich Änderungen nicht in die Quere kommen.
- Für jede sichtbare Änderung entstehen zuerst **Mockups** (Bilder für Computer 1440 px und Handy 390 px, nur hell). Noah gibt sie mit «… freigegeben» frei. Erst dann wird gebaut.
- Fertige, grüne Pull Requests werden am Abend zu einem **Tagespaket** gebündelt. Noah merged es selbst.
- Details: [Dokument 4, Entscheidungen](04-entscheidungen.md).

## Wichtigste offene Punkte (14.10.2026)

1. **Tagespaket 0.132.0 (#151)** muss von Noah gemerged werden. Daran hängen Design-Refresh 0.133.0 («Wi gaht's?»), Standard-Paket 0.134.0, Meditation 0.135.0 und Texte im Flow 0.136.0.
2. **Bildfreigaben stehen aus** für u. a. Wieder sichtbar (WS1–WS7), Höhenprofil (HP1–HP5), Tennis-Buchung (BU1–BU5), Hinweistexte (HT1–HT2), Claude in der App (KI1–KI3).
3. **Kurs-Check:** Reihenfolge der Bündel nach dem Tagespaket (siehe [Dokument 5](05-spezifiziert-und-offen.md#reihenfolge-nach-dem-tagespaket)).
