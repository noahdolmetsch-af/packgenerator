# Experimente mit Fahrt-Werten

PR folgt · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Plane Persönliches Lernen für Touren»), Idee 2 von 6

## Was ist neu
- Ein Versuch in Ich › Ruhig › Versuche kann jetzt Werte deiner Fahrten messen: **gefühlte Anstrengung der Fahrten** (Mittel deiner Antworten auf «Wie anstrengend war deine Fahrt?» an dem Tag, neu im Katalog von Auswerten als `rideFeel`), **Kadenz**, **Tempo** und **Watt pro Kilo**.
- Optional ein **zweiter Wert** zum Vergleichen (Feld `also`), zum Beispiel Kadenz neben der gefühlten Anstrengung. Jeder Wert bekommt seine eigene Karte mit «vor dem Versuch», «währenddessen», Spannweite und ehrlichem Wort.
- Ein fertiges Beispiel «Fahre ich mit höherer Kadenz angenehmer?» füllt Frage, Änderung, beide Werte und 14 Tage ein. Die Beispiele stehen jetzt auch nach dem ersten Versuch unter dem Formular.
- Bei Fahrt-Werten sagt ein Satz im Formular, dass es sie nur an Tagen mit einer Fahrt gibt und dass 14 Tage oder mehr mehr zum Vergleichen geben.
- Rechenregeln: `src/lib/ruhig/versuch-wert.js` (`RIDE_METRICS`, `RIDE_DAYS`), `src/lib/ruhig/versuche.js` (`also`), Katalog `src/lib/analyse/catalog.js` (`feelDay`).

## Was fällt weg oder rutscht tiefer
- nichts. Die Beispiel-Chips verschwanden früher nach dem ersten Versuch; jetzt bleiben sie.

## Selbst entschieden
- Erweitert die bestehenden Versuche (Ruhig), kein neues System: gleiche Regel wie beim Wert-Vergleich (Mittel der Tage des Versuchs gegen gleich viele Tage davor, «klar» erst über dem Doppelten der Streuung, mindestens 3 Tage mit Wert je Seite).
- Tage ohne Fahrt haben keinen Wert und zählen nicht; darum die 14 Tage im Beispiel.
- Nur beschreiben, nie erklären: die Karte sagt «höher», «tiefer» oder «kein klarer Unterschied» und «Ein Hinweis, kein Beweis», nie, warum.
- Die Zeile «Tag 3 von 14» einer laufenden Probe hatte noch keinen deutschen Text; ich habe ihn nachgetragen (Startet am, Tag n von, Vorbei, Beendet).
- Notizen schreibst du wie bisher je Tag des Versuchs.
- Kein Schema- und kein Backup-Format geändert: `also` ist optional im bestehenden Einstellungs-Eintrag, alte Einträge bleiben gültig.
- Fertig-Regel: erweitert eine bestehende Funktion («Eigene Experimente»), darum keine neue Funktions-ID; Seite, Absprung, leerer Zustand und Gut zu wissen bestehen.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan
- Persönliches Lernen: Idee 2 von 6 gebaut. Reihenfolge nach Runde 1: 1, 4, 6, 3, 5, 2.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Ruhig › Versuche: das Beispiel «Fahre ich mit höherer Kadenz angenehmer?» tippen.
2. Das Formular hat «Gefühlte Anstrengung der Fahrten» und als zweiten Wert «Kadenz», der Versuch läuft 14 Tage.
3. Nach dem Start (oder mit Startdatum vor zwei Wochen) zeigt die Karte für jeden Wert davor und währenddessen.
