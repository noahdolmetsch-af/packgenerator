# Tourenvorschläge: Profil und Karte zeigen dieselbe Stelle

PR (Nummer nach dem Öffnen) · 23.11.2026 · Auftrag: Noah «1-5a» (Idee B des Höhenprofil-Auftrags, Thread «100 kluge MTB-Touren vorschlagen»).

## Was ist neu
- **Dasselbe Höhenprofil wie überall:** auf der Seite einer vorgeschlagenen Tour steht das gemeinsame Profil (`ProfileStrip`) mit Steilheitsfarben, Zoom und Cursor; das eigene kleine Profil der Seite ist weg.
- **Profil und Karte zeigen dieselbe Stelle:** ein Tipp oder Ziehen im Profil setzt den Punkt auf der Karte; ein Tipp auf die Karte nahe der Linie (bis 2 km) setzt den Cursor im Profil.
- **Untergrund-Streifen bleibt:** Singletrail, Schotter/Weg und Asphalt als farbiger Streifen mit Legende unter dem Profil (`Untergrund.svelte`).

## Was fällt weg oder rutscht tiefer
- Der Schieberegler unter dem Profil entfällt; das Profil selbst ist jetzt das Bedienelement (Tippen, Ziehen, Pfeiltasten).

## Selbst entschieden
- Ein Tipp auf die Karte weiter als 2 km von der Linie tut nichts (sonst springt der Cursor bei jedem Wischen-Ende).
- Die Höhen der Tour liegen gleichmässig über der Länge (etwa alle 100 m); daraus entsteht das feine Profil.
- «Die steilsten Stücke» (ab 12 %) folgen als eigener PR.

## Entscheide (eigene Datei `docs/decisions/tourenvorschlaege-profil.md`)
- 23.11.2026: kein eigenes Profil auf der Seite, das gemeinsame Profil wird benutzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Tourenvorschläge › eine Tour öffnen, ins Profil tippen: auf der Karte erscheint ein Punkt an derselben Stelle.
2. Auf der Karte die Linie antippen: der Cursor im Profil springt dorthin.
3. Unter dem Profil steht der Untergrund-Streifen mit Legende. Am Handy passt alles in die Breite.
