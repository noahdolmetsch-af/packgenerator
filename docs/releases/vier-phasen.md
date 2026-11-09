# Vier Phasen statt Schrittleiste

PR #1205 · 08.11.2026 · Auftrag: Noah «jetzt» (Plan-Schritt 1b «Vier Phasen statt Leiste»; Thread «Bauen: vier Phasen statt Navigationsleiste»). Baut auf dem Tour-Pfad (#1184) auf.

## Was ist neu
- Die Schrittleiste oben auf jeder Tour-Seite zeigt jetzt die vier Phasen des Tour-Pfads: **Planen · Vorbereiten · Unterwegs · Danach**, und am Ende wie bisher **Auswertung** als fünften Punkt (Noah «b» auf «Wohin kommt Analyse?»). Jeder Punkt öffnet dieselbe Seite wie bisher (Planen `#/pack`, Vorbereiten `#/pack?day`, Unterwegs `#/ride`, Danach `#/debrief/<Tour>`, Auswertung die Tour-Seite), mit demselben kurzen Stand darunter wie bisher («2 offen», «24/32», «ab Sa», «gespeichert»). Gilt auf den Tour-Seiten, auf den Zwischenseiten («Gepackt», «Tour beendet») und am Handy wie am Computer.
- Eine Tour ohne Velo hat wie bisher kein «Unterwegs»: vier Punkte.
- Technik: `src/lib/stepbar.js` (`STEP_BAR`) nennt die Wörter; `src/lib/ui/StepBar.svelte` zeigt sie. Die Seiten, Adressen und der Stand-Text (`tabStatus`) bleiben, wie sie waren. Kein neues Datenformat, nichts wird gespeichert.

## Was fällt weg oder rutscht tiefer
- Die Wörter ändern sich: «Plan» heisst «Planen», «Pack» «Vorbereiten», «Live» «Unterwegs», «Review» «Danach», «Analyse» «Auswertung». Sonst nichts: kein Punkt rutscht tiefer, kein Tipp mehr als bisher.
- Die Knöpfe behalten ihre Wörter («Weiter zu Packen»).

## Selbst entschieden
- Vorbereiten öffnet das Packen (`#/pack?day`), weil Packen die Hauptarbeit der Phase ist; Körper und Velo sind im Tour-Pfad als Zeilen erreichbar (Link «Tour-Pfad» in der Zeile «‹ Touren»).
- Die Phase in der Leiste kommt von der Seite, auf der du gerade bist (wie bisher bei den Schritten), nicht vom Datum. Das Datum wählt nur der Tour-Pfad («Schritt n von 4»).
- «Auswertung» nimmt den Text `Analysis|stage` (schon vorhanden), kein neues Wort.
- Erst gebaut als vier Punkte mit zweiter Zeile «Rückblick · Auswertung» in «Danach» (Vorschlag a der Karte); Noah wählte b, deshalb ist die zweite Zeile wieder weg.
- `docs/namen.md` Zeile 1 (Schrittleiste) nennt die Phasen.
- Die alte «Was ist neu»-Datei `kurze-schritte.js` bleibt als Geschichte unverändert.
- Fertig-Regel: kein neuer Katalogeintrag (keine neue Funktion, nur die Leiste einer bestehenden); `docs/app-stand.md` ist bei der Zeile «Tour-Pfad» ergänzt.

## Entscheide (für decisions.md)
- keine neuen (Noahs «A» steht in `docs/releases/tour-pfad.md`)

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App»: Schritt 1b gebaut (Zeile in `docs/plan-ganze-app.md`). Danach 2a (Karte «Meine Tour» auf Heute).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Tour öffnen (Touren › Tour, Planen): oben steht die Leiste «Planen · Vorbereiten · Unterwegs · Danach · Auswertung».
2. «Vorbereiten» antippen: das Packen öffnet sich, «Vorbereiten» ist markiert.
3. «Danach» antippen: der Rückblick öffnet sich; «Auswertung» antippen öffnet die Tour-Seite.
