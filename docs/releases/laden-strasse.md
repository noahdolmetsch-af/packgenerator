# Ein Velo auf der Strasse beim Laden

PR (diese Änderung) · 03.11.2026 · Auftrag: Noah «b» (Paket D, Idee 14 «Laden als Strasse»; Thread «Durchgehen: offene Fragen einzeln»); Ziel 5 «Alltag»

## Was ist neu
- Der Lade-Platzhalter (`Skeleton.svelte`, erscheint nach 0,3 s Wartezeit und beim Start von Heute) zeigt statt grauer, schimmernder Balken eine Karte mit gestrichelter Strasse. Ein kleines gezeichnetes Velo fährt darüber, die Räder drehen sich.
- Das Velo ist ein eigener Baustein (`src/lib/ui/RoadBike.svelte`); das Nachtlicht der Live-Navigation (Idee 20) zeichnet dasselbe Velo.
- Bei «Bewegung reduzieren» steht das Velo still in der Mitte der Strasse.

## Was fällt weg oder rutscht tiefer
- Die grauen Schimmer-Balken beim Laden fallen weg. Die Karten bleiben in ähnlicher Grösse (Heute: eine grosse und zwei kleine, Listen: eine Karte, die mit der Zeilenzahl wächst), die kleinen auf Heute sind etwas höher als die alten Balken.

## Selbst entschieden
- Jede Platzhalter-Karte bekommt ihre eigene Strasse; die zwei kleinen Karten auf Heute starten versetzt, damit sie nicht im Gleichschritt fahren.
- Farbe des Velos ist die Akzentfarbe der App (`--hi`), die Strasse die Linienfarbe.
- `docs/app-stand.md` ist noch nicht auf `main` (PR #742 offen); die Zeile folgt nach dessen Merge.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket D «Laden, Leere und Wetter»: Idee 14 gebaut (Idee 19, 15, 10, 20 folgen als eigene PRs).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen, am besten nach einem Neustart oder bei langsamem Netz: kurz fährt ein Velo über eine gestrichelte Strasse.
2. Am Handy «Bewegung reduzieren» einschalten und die App neu öffnen: das Velo steht still.
