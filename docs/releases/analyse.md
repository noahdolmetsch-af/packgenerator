# Analyse: alle deine Werte

PR #<offen> · 27.10.2026 · Auftrag: Noah «1a 2a 3a 4a 5b» + 7 eigene Ideen (Thread «Analyse-Tool für alle Daten»)

## Was ist neu
- Neuer Tab **Auswerten › Analyse**: jeder Wert der App als Kachel mit kleinem Verlauf (Fitbit: Ruhepuls, HRV, Schlaf, Schritte, Aktivzonenminuten …; Strava: km je Sportart; Körper; «Wi gaht's?»; jede Aktiv-Aktivität wie Sauna, Gym, Eishockey, Tennis).
- Quellen ein- und ausschalten (Aktiv, Fitbit, Strava, Körper, Wi gaht's?) und Zeitraum 7 / 30 / 90 Tage / Jahr; die Wahl bleibt gespeichert.
- Ein Tipp auf eine Kachel öffnet den Verlauf des Werts (Körperwerte, Sportart oder «Haken ausgewertet»).
- «Aktiv heute» auf Heute: der Link heisst jetzt **«Mehr»** und führt zur Analyse.
- Fix: die «•••» auf den Aktiv-Kacheln haben eine feste Grösse und decken die Namen nicht mehr ab.

## Was fällt weg oder rutscht tiefer
- Der Link «Alle n in Aktiv» auf der Karte «Aktiv heute» → heisst «Mehr» und öffnet die Analyse. Aktiv selbst erreichst du weiter über die Navigation.

## Selbst entschieden
- Werte ohne Daten im Zeitraum werden ausgeblendet statt leer gezeigt.
- Summen (Schritte, km, Haken) als Balken, Durchschnitte (Puls, Schlaf) als Linie.
- Eigene «Wi gaht's?»-Fragen erscheinen mit ihrem eigenen Namen.

## Entscheide (für decisions.md)
- 27.10.2026: Analyse als Tab in Auswerten plus «Mehr» auf Heute (1a); Körperwerte wird die Detailansicht (2a); zusätzliche Google-Werte als eigener Schritt (3a); eigene, beschriftete Berechnungen (4a); Kachel-Fix und Schritt 1 zusammen (5b).

## Stand im Plan (roadmap.md / vorhaben.md)
- Analyse-Tool: Schritt 1 (Übersicht aller Werte) gebaut. Nächste kleine PRs: Detail je Wert, Aktiv-Übersicht, Ebenen, Vergleiche, Muster, Rekorde, Filter + gespeicherte Ansichten, Tagesbild, Touren-Band, Saisons, Serien und Lücken, Velo km + Verschleiss, neue Google-Werte, eigene Berechnungen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen, zur Karte «Aktiv heute»: die Namen sind ganz lesbar, die «•••» sitzen rechts daneben.
2. Auf «Mehr» tippen: die Seite «Analyse» öffnet sich mit Gruppen Herz, Schlaf, Bewegung, Sport, Aktiv.
3. Oben «Strava» ausschalten: die Sport-Kacheln verschwinden; «90 Tage» wählen und neu laden: die Wahl bleibt.
4. Auf die Kachel «Sauna» tippen: «Haken ausgewertet» für Sauna öffnet sich.
