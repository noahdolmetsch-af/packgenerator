# Touren: die laufende Tour zuerst

PR (offen) · 24.11.2026 · Auftrag: Noah «1-5a» und «ja» (Thread «Warteliste», Welle 2 der impeccable-Prüfung, Fund F2)

Klarheit: wer unterwegs die App öffnet, sieht auf Touren zuerst seine laufende Tour. Auffindbarkeit: das Band «Unterwegs · Tag n von m» steht direkt unter dem Titel statt hinter zwei Knöpfen und Hilfen (vorher bei 730 px, jetzt im ersten Bildschirm).

## Was ist neu
- Das Band der laufenden Tour («Unterwegs · Tag 2 von 3», oder «Packmodus») steht direkt unter dem Titel, vor den Pack-Karten und «Geplant».
- «Fahrt hochladen» ist ein ruhiger Link unter «Geplant» (statt eines Knopfs oben).
- Das Band «Neu: Jede Tour hat eine Sportart» steht am Seitenende, vor «Alle Funktionen von Touren».

## Was fällt weg oder rutscht tiefer
- «Fahrt hochladen» (Knopf im Kopf) rutscht als Link unter «Geplant» (einen Bildschirm tiefer; über die Suche, «Neu» und «Alle Funktionen» weiter direkt erreichbar). «Tour aus komoot» bleibt als ruhiger Link im Kopf (Knopf-Formen). Auf der leeren Seite und auf «Fahrten von Strava» bleibt alles wie vorher.
- Das Band «Neu: Jede Tour hat eine Sportart» rutscht ans Seitenende.
- Sonst nichts.

## Selbst entschieden
- Die Regel «Auf dieser Seite nur ab zwei Zielen» (`HintCard`, gilt app-weit) bleibt für einen eigenen PR: sie berührt jede Seite mit Sprung-Chips.
- Auf der leeren Seite (noch keine Tour) und auf «Fahrten von Strava» bleibt der Knopf oben wie bisher, damit eine leere Seite ihren Einstieg behält.
- Baut auf PR 1514 (Pack-Karten) und PR 1674 («Rennen ›», «Unterwegs ›» auf der Übersicht) auf.

## Entscheide (eigene Datei `docs/decisions/`)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- impeccable-Prüfung ganze App, Welle 2, Paket 7: gebaut

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen: das Band der laufenden (oder zu packenden) Tour steht direkt unter dem Titel.
2. Zu «Geplant» scrollen: «Fahrt hochladen» steht dort als ruhiger Link, ein Tipp öffnet ihn.
