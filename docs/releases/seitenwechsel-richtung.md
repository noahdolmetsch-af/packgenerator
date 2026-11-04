# Seiten zeigen, wohin du gehst

PR folgt · 03.11.2026 · Auftrag: Noah «b» (Thread «Durchgehen: offene Fragen einzeln», Paket A Seitenwechsel, Idee 1 von 5)

Ziel 5 «Alltag» (Entscheid 26.10.2026 «Bewegung überall sanft»), Idee aus `notes/ideen-bewegung-2026-11-03`.

## Was ist neu
- Geht man tiefer (Heute oder Touren → eine Tour → Packen, Fahren, Rückblick der Tour), gleitet die neue Seite in etwa 0,2 s von rechts herein. Beim Zurück gleitet sie von links herein. Man spürt, wo man ist, ohne auf die Pfadzeile zu schauen.
- Nur die neue Seite bewegt sich (leicht verschoben und eingeblendet). Die Reiter oben, die Pfadzeile und die Leiste unten bleiben stehen. Die alte Seite ist sofort weg, nichts steht doppelt auf dem Bildschirm.
- Zwischen den Orten (Heute, Planen, Touren, Aktiv, Velos, Ich) und zwischen Reitern desselben Ortes gleitet nichts: das ist kein «tiefer».
- Aus bei «Bewegung reduzieren» am Gerät und bei Ich › Darstellung › Bewegung «Aus».

## Was fällt weg oder rutscht tiefer
- nichts (vorher sprang jede Seite sofort; die Seiten selbst und ihre Wege sind gleich)

## Selbst entschieden
- «Tiefer» sind drei Stufen (`src/lib/nav/slide.js`): 0 Heute, 1 Seite eines Ortes (Reiter, Ich), 2 Seite, die man von dort öffnet (eine Tour, ein Werkzeug, eine Unterseite von Ich), 3 die Arbeit an einer Tour (Packen, Fahren, Live, Rückblick einer Tour). Gleiche Stufe oder nur Stufe 0/1 untereinander: keine Bewegung.
- Nur die neue Seite gleitet (kein Ausblenden der alten Seite), wie bei den Fenstern: so entstehen keine doppelten Elemente (die Tests suchen nach einer Seite) und es braucht kein Warten.
- Kurzer Weg (22 px) mit Einblenden statt ganze Bildschirmbreite: ruhig, und die Seite wird nie breiter als der Bildschirm (`overflow-x: clip` nur während der Bewegung).
- Eine Seite, die erst beim ersten Besuch nachlädt, gleitet beim Erscheinen (innerhalb von 0,28 s); später Erscheinendes (Karten, Listen) gleitet nicht von selbst.
- Zurück per Browser-Taste: gleiche Regel nach Stufe, keine eigene Erkennung.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket A Seitenwechsel, Idee 1: gebaut. Folgen in dieser Reihenfolge: 3 Markierung unten, 4 Einblenden, 2 Titel fliegt mit, 5 grosser Titel wird klein.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren: eine Tour öffnen. Die Seite gleitet kurz von rechts herein.
2. Oben links «Touren» antippen: die Seite gleitet von links herein.
3. Unten zwischen Heute, Touren und Aktiv wechseln: nichts gleitet.
