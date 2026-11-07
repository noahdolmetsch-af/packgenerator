# Ausgemusterte Velos bleiben weg

PR (Fehlerbehebung zu «Velos ausmustern») · 5.11.2026 · Auftrag: Noah, Thread «Überdenke die Kachel «Jetzt dran»»

## Was ist neu
- Ein ausgemustertes Velo («Gravel Factor LS») erschien in «Jetzt dran» weiter als «Idee: heute bis 2,5 Std. mit dem … fahren». Ursache: Heute (`Home.svelte`) las alle Velos und filterte nicht; «Velos ausmustern» (PR 1) hatte die Auswahl-Listen angepasst, aber nicht Heute.
- Heute liest jetzt nur noch aktive Velos (`activeBikes`). Das gilt für die Fahr-Idee, «Anderes Velo», Pflege-Zeilen («… fällig», «Kette ölen in … km»), «N Velos wägen», Verschleiss-Zeile, Velo-Blätter-Erinnerungen, die Velo-Kacheln und die Tageskarte.
- Die gemeinsamen Regeln `quickPlan` und `lastBikeId` ignorieren ausgemusterte Velos. Damit sind auch Schnellstart in Packen, Überraschung, Spot-Runde und die Vorauswahl bei komoot geschützt.
- Auch die Zahl bei «Velos» in der Leiste, der Kalender («Merken») und der Hinweis «N Velos mit Fälligem» bei Quick Links zählen ausgemusterte Velos nicht mehr.
- Eine Tour, die auf einem ausgemusterten Velo gefahren wurde, kennt das Velo weiter (Name auf der Tour-Karte).

## Was fällt weg oder rutscht tiefer
- Nichts. Ausgemusterte Velos fehlen auf Heute, wie schon in den Auswahl-Listen.

## Selbst entschieden
- Touren-Karte, Tour-Vorlage und Pflegeschritte einer bestehenden Tour finden das Velo weiter über alle Velos (`allBikes`), sonst fehlte der Name.
- Nicht angefasst, weil sie ausgemusterte Velos absichtlich zeigen oder mit Absicht alles lesen: Verkaufstext und Fotos (siehe PR 1), Auswertungen (zählen weiter).
- «Werkstatt-Quittung:» ohne Text in «Jetzt dran» hat eine andere Ursache (leere Schnellnotiz wird als Lernpunkt abgelegt). Das ist nicht in diesem PR, sondern ein eigener Vorschlag.

## Entscheide (für decisions.md)
- nichts Neues (setzt «Auswahl-Listen zeigen ausgemusterte Velos nicht» vom 1.11.2026 auch auf Heute fort)

## Stand im Plan (roadmap.md / vorhaben.md)
- Velos ausmustern: Heute ist jetzt dabei.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: «Idee: … fahren» nennt nicht mehr das ausgemusterte Velo («Anderes Velo» wechselt nur zwischen den übrigen).
2. Unter «Jetzt dran» steht keine Pflege-Zeile und kein «Velos wägen» mehr, das nur das ausgemusterte Velo betrifft.
