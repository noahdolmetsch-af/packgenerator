# Draussen-Challenge: tägliche Erinnerung aufs Handy um 16:00

Auftrag: Noah 21.11.2026 («2b»: Karte auf Heute und später ein Knopf «Täglich um 16:00 aufs Handy erinnern»). Thread «Challenges in den Vordergrund stellen». Folgt auf die Karte «Draussen» (PR 1).

## Was ist neu
- Auf der Karte «Draussen» steht ein Knopf «Täglich um 16:00 aufs Handy erinnern». Er schaltet die neue Handy-Erinnerung «Challenge Draussen» ein und, wenn nötig, den Hauptschalter (das Handy fragt dann einmal nach Mitteilungen, wie in Ich › Erinnerungen aufs Handy). Danach steht dort «Erinnerung aufs Handy: täglich um 16:00» mit «Ausschalten».
- Die Erinnerung kommt jeden Tag zur eingestellten Zeit (vorbelegt 16:00; die Zeit änderst du hinter dem Stift) für die nächsten 14 Tage, solange die Challenge läuft. Sie sagt, wie viele Minuten heute noch fehlen («Heute noch 60 Min draussen. Auch ein kurzer Spaziergang zählt.»).
- Ein Tag, der schon erreicht ist (Strava und von Hand zusammen), schickt keine Erinnerung: die Liste geht neu aufs Handy, sobald du Minuten dazuzählst, die App öffnest oder sie in den Hintergrund legst.
- Ich › Erinnerungen aufs Handy hat unter «Alltag» einen neuen Schalter «Challenge Draussen» (gleicher Schalter wie auf der Karte).

## Was fällt weg oder rutscht tiefer
- Nichts. Die Karte bekommt eine Zeile dazu; die Schalterliste hat einen Schalter mehr.

## Selbst entschieden
- Eine eigene Handy-Erinnerung statt einer wiederkehrenden Merken-Aufgabe: Merken schickt ein Handy-Signal nur einmal je Fälligkeit und nur bis zur nächsten, ein tägliches Wiederholen würde ohne App-Besuch schweigen.
- Die Zeit steht im Datensatz der Challenge (`remindAt`, vorbelegt 16:00), der Ein/Aus-Schalter in den Handy-Erinnerungen (`outdoor`). Keine neue Tabelle, keine Schema-Version; der Datensatz `outdoor` reist wie bisher in jedem Backup und im Geräteabgleich (ältere Datensätze ohne Zeit bekommen 16:00).
- Erinnerungs-Budget und «Ruhig»-Ansicht zählen die Erinnerung zu «Alltag» (nicht zu den Sicherheits-Warnungen).
- Grenze: Die Erinnerung weiss nur, was beim letzten Senden der Liste da war. Kommt eine Strava-Aktivität erst später am Tag und die App bleibt zu, kommt die Erinnerung trotzdem.
- Der Server (`api/`) ändert sich nicht: die Liste ist wie bei allen anderen Arten ein Eintrag je Tag mit Zeit, Titel und Text.
- Fertig-Regel: Seite (Karte und Schalter, Zeile in app-stand.md), Absprung (der Knopf steht auf der Karte, wo man die Erinnerung braucht), Inhalt unverändert, leerer Zustand (ohne Challenge kein Knopf), nächster Schritt (Meldung «Die Erinnerung kommt jeden Tag um 16:00»), App-Stand (Zeile «Draussen-Challenge» ergänzt).

## Stand im Plan
- Challenges in den Vordergrund: PR 1 Karte, **PR 2 Erinnerung (dieser)**, danach 3 Frage alle 10 Tage, 4 Seite «Challenges».

## Prüfschritte (nach dem Merge auf der echten Seite, am Handy)
1. Heute öffnen, auf der Karte «Draussen» «Täglich um 16:00 aufs Handy erinnern» tippen, Mitteilungen erlauben: die Zeile «Erinnerung aufs Handy: täglich um 16:00» erscheint.
2. Ich › Erinnerungen aufs Handy: «Challenge Draussen» unter «Alltag» ist an; «Test senden» zeigt, wie es ankommt.
3. Auf der Karte «Ausschalten» tippen: der Schalter ist wieder aus.
