# Strava-Fahrten werden nicht mehr doppelt geholt

PR # · 22.11.2026 · Auftrag: Noah «Warteliste Strava-Doppel», «a» (Zeile «Aufräumen?») und «freigabe» (Einzelfreigabe zum Aufräumen) (Thread «Sync»)

## Was ist neu
- Ein Strava-Eintrag im Fahrten-Buch bekommt als Schlüssel die Strava-Nummer der Fahrt. Holen zwei Geräte dieselbe Fahrt, bevor sie sich abgleichen, entsteht ein Eintrag, nicht zwei.
- Die vorhandenen Doppel (dieselbe Strava-Nummer, zweimal «gezählt») lassen sich finden und aus der Zählung nehmen. Die Zusatzeinträge werden auf «ausgelassen» gesetzt mit Grund «doppelt», nichts wird gelöscht, mit Rückgängig.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Eintrag mit den meisten Daten (Puls, Höhenmeter, Startzelle) bleibt, bei Gleichstand der mit dem kleineren Schlüssel.
- Das Aufräumen fasst Noahs Daten an: Einzelfreigabe von Noah am 22.11.2026 («freigabe»), vor dem Aufräumen macht die App eine Kopie der Daten (Kopien vor Updates), und es gibt Rückgängig.
- Die Zeile steht im Fahrten-Buch unter «Mehr» (Inhalt zuerst: nichts oben auf der Seite), dazu eine Marke «n Fahrten doppelt» auf «Mehr».

## Stand im Plan
- Warteliste: Punkt «Strava-Doppel».

## Prüfschritte (nach dem Merge)
1. Strava auf Computer und Handy kurz hintereinander holen, ohne dazwischen abzugleichen, dann abgleichen: jede Fahrt steht einmal im Fahrten-Buch.
