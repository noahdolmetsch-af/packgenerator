# Schlag deinen Geist: diese Fahrt gegen eine frühere

PR #<offen> · 03.11.2026 · Auftrag: Noah «Ich möchte alle 1-7 Ideen umsetzen» (Thread «Umsetzen: Sieben Cockpit-Ideen», Idee 4, nach der Fahrt)

## Was ist neu
- Auf jeder Velofahrt mit Puls steht die neue Analyse-Karte **«Schlag deinen Geist»**. Der «Geist» ist eine frühere Fahrt von dir: die App wählt die ähnlichste (zuerst dieselbe Strecke, dann am nächsten bei km und Höhenmetern, bei Gleichstand die neuere). Du kannst in der Liste eine andere wählen (bis zu 6).
- Ein ruhiger Satz: «Gleiche Leistung wie dein Geist, 4 Schläge weniger Puls.», sonst «x % mehr/weniger Watt pro Schlag» oder «auf Augenhöhe».
- Eine Tabelle «diese Fahrt / Geist / Unterschied»: Leistung, Puls, Watt pro Schlag, Tempo, Zeit und die **Drift** in der zweiten Hälfte (wenn beide Fahrten Hälften-Daten haben).
- **Vergleichbarkeit sichtbar:** Felder für Strecke (gleich / nicht gleich), Distanz, Höhenmeter, Temperatur und Wind. Wo ein Wert nicht bekannt ist (kein Strava-Wetter), steht «nicht bekannt».
- Die Karte lässt sich ausblenden und verschieben wie jede Analyse («Analysen anpassen»).

## Was fällt weg oder rutscht tiefer
- nichts. «Ähnliche Fahrten» und «Deine Hausrunde» bleiben, wie sie sind; die neue Karte steht danach.

## Selbst entschieden
- **Nur nach der Fahrt**, nicht live: die App speichert keinen Sekunden-Verlauf.
- Kandidaten: frühere Velofahrten mit Puls, km innerhalb ±25 %, Höhenmeter innerhalb ±30 % (wo bekannt). «Gute Übereinstimmung»: gleiche Strecke, oder km ±10 % und Hm ±15 %; sonst «ziemlich ähnlich, mit Vorsicht».
- Effizienz = Watt pro Schlag (mit Leistung auf beiden Fahrten), sonst km/h pro Schlag. «Gleiche Leistung» = innerhalb 5 %; «auf Augenhöhe» = innerhalb 2 % bei Watt pro Schlag.
- Drift = Abfall von Watt pro Schlag von der ersten zur zweiten Hälfte (mit Leistung), sonst Anstieg des Pulses; nur wenn beide Fahrten dieselbe Art haben.
- Temperatur: Sensor der Fahrt, sonst Strava-Wetter; Wind nur aus dem Strava-Wetter. Beides nur, wenn beide Fahrten es haben.
- Die Wahl des Geistes wird nicht gespeichert (die App schlägt jedes Mal den ähnlichsten vor).
- Kein Schema- und kein Backup-Format geändert.
- Fertig-Regel: Seite (Karte auf der Fahrt, «Analysen anpassen») ja; Absprung: die Karte steht dort, wo man die Fahrt ansieht, der Geist ist ein Link zur früheren Fahrt; leerer Zustand: ohne vergleichbare Fahrt zeigt die Karte nichts (wie «Ähnliche Fahrten»); «Gut zu wissen» entfällt.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Cockpit-Ideen (`notes/ideen-cockpit-2026-11-03`): Idee 4 gebaut (nach der Fahrt). Weiter: 1, 2.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › eine Velofahrt mit Puls öffnen, zu «Schlag deinen Geist» scrollen.
2. Satz und Tabelle lesen, bei «Gute Übereinstimmung» die Felder für Strecke, Distanz, Höhenmeter ansehen.
3. In der Liste einen anderen Geist wählen: Tabelle und Satz ändern sich.
