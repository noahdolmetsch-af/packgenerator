# Ein Punkt zeigt, wie es um den Abgleich steht

PR folgt · 21.11.2026 · Auftrag: Noah «1-5a» (Punkte 1 und 2, Thread «Fix Abhaken-Sync zwischen Computer und Handy»)

## Was ist neu
- **Punkt am «Ich»-Knopf** (`src/lib/nav/MeButton.svelte`, Zustand in `src/lib/sync/health.js`): grün, wenn der Abgleich eingeschaltet ist und die letzte Runde weniger als 10 Minuten her ist und gut ging; orange, wenn er aus ist (Gerät mit Daten, ohne «Nur ein Gerät») oder hinterherhinkt (Fehler oder älter als 10 Minuten). Kein Punkt in der Demo, ohne Daten oder nach «Nein, nur hier».
- **Zeile auf Heute** in «Wichtig heute» (`src/lib/home/zustand.js`): «Der Abgleich ist aus. Was du hier änderst, kommt nicht aufs andere Gerät.» mit «Einschalten»; oder «3 Änderungen sind noch nicht aufs andere Gerät gesendet» mit «Jetzt versuchen». Bei gutem Abgleich steht nichts da.
- **«Noch kein zweites Gerät»** (neuer Zustand `alone`): Läuft der Abgleich, hat aber in 10 Minuten noch nie ein anderes Gerät etwas hineingeschickt, wird der Punkt orange, Heute zeigt «Der Abgleich ist an, aber noch kein anderes Gerät hat etwas hineingeschickt. Ist dein anderes Gerät mit demselben Code gekoppelt?» mit «Koppeln» und «Nur ein Gerät», und Ich › Daten und Backup sagt es ebenfalls. Das ist genau der Fall von heute: Handy und Computer hatten je einen eigenen Abgleich mit eigenem Code und beide sahen gut aus. Jeder Eintrag trägt jetzt eine zufällige Geräte-Kennung des Schreibenden (`from`, nur im verschlüsselten Umschlag, `src/lib/sync/engine.js`); ein Gerät merkt sich in den Abgleich-Einstellungen (`peerSeen`), ob je ein anderes geschrieben hat. Nur für Abgleiche, die nach diesem Update neu eingeschaltet oder neu gekoppelt werden (`peerWatch`); ein bestehender Abgleich wird nicht beurteilt, damit nichts falsch Alarm schlägt.
- Anlass: Der Computer hatte den Abgleich gar nicht eingeschaltet, und nichts hat es gesagt.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Punkt ist klein (11 px) und liegt an der unteren rechten Ecke des Knopfes, damit er die Zahl für den Eingang (oben rechts) nicht verdeckt. Farben aus den bestehenden Tönen `--ok` und `--warn`; der Zustand steht zusätzlich im Hinweistext des Knopfes (Bildschirmleser).
- «Hinterher» heisst: letzte Runde älter als 10 Minuten. Die App fragt bei offenem Fenster alle 20 bis 60 Sekunden; ein Punkt wird darum nur orange, wenn wirklich etwas hakt (Netz weg, Fehler).
- Das frühere Gebot «nichts über den Abgleich ausserhalb von Ich» (24.10.2026) gilt für Fragen bei Änderungen auf beiden Geräten weiter; Noahs «1-5a» vom 21.11.2026 erlaubt Punkt und Zeile.

## Entscheide (für decisions.md)
- Der Abgleich-Zustand darf als Punkt am «Ich»-Knopf und als Zeile in «Wichtig heute» sichtbar sein (Noah 21.11.2026 «1-5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Absicherung des Abgleichs (Noah «1-5a»), Punkte 1 und 2 von 5.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Der runde «Ich»-Knopf hat unten rechts einen kleinen Punkt (grün bei laufendem Abgleich).
2. Ist der Abgleich aus, steht auf Heute in «Wichtig heute» «Der Abgleich ist aus …» mit «Einschalten».
