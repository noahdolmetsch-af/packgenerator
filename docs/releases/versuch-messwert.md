# Eigene Experimente mit Messwert

PR #<offen> · 03.11.2026 · Auftrag: Noah «Ich möchte alle 1-7 Ideen umsetzen» (Thread «Umsetzen: Sieben Cockpit-Ideen», Idee 6)

## Was ist neu
- Ein Versuch in Ich › Ruhig › Versuche kann jetzt **einen Wert messen** (freiwillig): Schlaf, Schlafeffizienz, Ruhepuls, HRV, Tagesform, «Wie geht's» (Schlaf/Energie/Stimmung) oder Schritte.
- Die Karte des Versuchs zeigt ab dem ersten Tag: **Mittelwert vor dem Versuch** (gleich viele Tage davor) gegen **Mittelwert währenddessen**, mit tiefstem und höchstem Wert und der Zahl der Werte.
- Darunter ein ehrliches Wort: «höher», «tiefer» oder «kein klarer Unterschied» (wenn der Unterschied nicht grösser ist als die Schwankung von Tag zu Tag), plus «Ein Hinweis, kein Beweis».
- Unter 3 Werten auf einer Seite sagt die Karte «noch zu wenige Werte» und urteilt nicht.
- «Nochmal versuchen» behält den Wert.

## Was fällt weg oder rutscht tiefer
- nichts. Versuche ohne Wert sehen aus wie vorher (nur das neue Feld «Mit einem Wert messen» im Formular).

## Selbst entschieden
- Erweitert das bestehende System «Eigene Versuche» (Ruhig), kein drittes System (Noah ★ 2a).
- Vergleich = Mittel der Tage des Versuchs gegen die gleich vielen Tage direkt davor. «Klar» heisst: Unterschied grösser als das Doppelte des Standardfehlers beider Mittel. Das ist eine Faustregel, kein Test; die Karte sagt es.
- Alle Tage des Versuchs zählen, auch Tage mit «nein». Die Häkchen bleiben daneben stehen.
- Werte kommen aus denselben Zahlen wie die Seiten unter Auswerten (Fitbit, deine Fragen); ohne Wert dort bleibt die Karte bei «zu wenige Werte».
- Die Auswahl ist eine kurze, feste Liste von neun Werten; weitere lassen sich später ergänzen.
- Kein Schema- und kein Backup-Format geändert: das Feld `metric` ist optional im bestehenden Einstellungs-Eintrag, alte Einträge bleiben gültig.
- Fertig-Regel: Seite (Versuche) und Absprung (bestehend) ja; leerer Zustand sagt, was fehlt; «Gut zu wissen» entfällt (Erweiterung einer Karte).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Cockpit-Ideen (`notes/ideen-cockpit-2026-11-03`): Idee 6 gebaut. Weiter: 4, 1, 2.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Ruhig › Versuche: Frage eintippen, unter «Mit einem Wert messen» «Ruhepuls» wählen.
2. Startdatum eine Woche zurück setzen und starten: die Karte zeigt «Vor dem Versuch» und «Während des Versuchs».
3. Die Zeile darunter sagt höher, tiefer oder «kein klarer Unterschied» und dass es ein Hinweis ist.
