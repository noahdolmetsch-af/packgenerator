# Strava-Fahrten werden nicht mehr doppelt geholt

Entwurf, noch nicht hochgeladen (Baustopp, Noah 22.11.2026 «Warteliste Strava-Doppel»)

## Was ist neu
- Ein Strava-Eintrag im Fahrten-Buch bekommt als Schlüssel die Strava-Nummer der Fahrt. Holen zwei Geräte dieselbe Fahrt, bevor sie sich abgleichen, entsteht ein Eintrag, nicht zwei.
- Die vorhandenen Doppel (dieselbe Strava-Nummer, zweimal «gezählt») lassen sich finden und aus der Zählung nehmen. Die Zusatzeinträge werden auf «ausgelassen» gesetzt mit Grund «doppelt», nichts wird gelöscht, mit Rückgängig.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Eintrag mit den meisten Daten (Puls, Höhenmeter, Startzelle) bleibt, bei Gleichstand der mit dem kleineren Schlüssel.
- Das Aufräumen ist noch ohne Knopf: Es fasst Noahs Daten an und braucht Einzelfreigabe und vorher eine Kopie des Backups. Knopf und Text kommen erst nach seinem ok.

## Stand im Plan
- Warteliste: Punkt «Strava-Doppel».

## Prüfschritte (nach dem Merge)
1. Strava auf Computer und Handy kurz hintereinander holen, ohne dazwischen abzugleichen, dann abgleichen: jede Fahrt steht einmal im Fahrten-Buch.
