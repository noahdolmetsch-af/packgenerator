# Mehr Muster in den Zusammenhängen

Auftrag: Noah 23.11.2026 (Thread «Zusammenhänge nützlicher machen»: «Muster», «Wetter und Training», «Erholungszeit», «Gegenbeispiele», «Neu diese Woche» und von Claudes Ideen «2 und 3»: Bester Bereich, Heute-Zeile). Ein gebündelter PR auf Wunsch des Bündlers (Noah: wenige PRs). Baut auf `zusammenhaenge-nuetzlich` auf.

## Was ist neu
- **Muster nach kurzer Nacht und hartem Tag**: Schlaf gegen Ruhepuls, HRV, Aktivzonenminuten und Schritte am gleichen Tag; Aktivzonenminuten gegen HRV, Akku, Stimmung und Schlafgefühl am Tag danach. Aktivzonenminuten teilen an der höchsten runden Zahl (200, 150, 100, 60, 30), über der mindestens 5 Tage liegen und darunter ebenfalls 5; sonst am Mittelwert. («Sport, Sauna, Tennis, Eishockey, Gym» standen schon im ersten PR.)
- **Wetter und Training**: Regen, Kälte (Tageshöchstwert) und Sonne gegen Velo-km, Schritte und Aktivzonenminuten; Regen gegen die Stimmung am Tag danach; Velo-km gegen Akku und Stimmung am Tag danach.
- **Wochentage** (Karte «Wochentage»): für Akku, Stimmung, Schlaf, Ruhepuls, HRV der tiefste und der höchste Wochentag mit sieben kleinen Balken, nur bei klarem Unterschied (t ≥ 3, mindestens 4 Tage je Wochentag, mindestens 5 Wochentage mit Daten), die zwei stärksten.
- **Erholung** (Karte «Erholung»): nach Tagen mit über 200 (oder der nächsten runden Zahl) Aktivzonenminuten, wie weit der Ruhepuls an den 5 Tagen danach über deinem Normal (Median) liegt und nach wie vielen Tagen er wieder normal ist (±1 Schlag); dazu «sinkt er langfristig»: Ruhepuls der letzten 30 Tage gegen die 30 davor.
- **Neu diese Woche entdeckt**: bis zu zwei Zusammenhänge, die heute zeigen und vor einer Woche nicht, oder deutlich klarer geworden sind (|ρ| +0.15). Berechnet aus den Daten, nichts wird gespeichert.
- **Bester Bereich** im geöffneten Satz: die Werte in Drittel geteilt (runde Grenzen), das beste Drittel benannt mit seinem Mittel gegen die anderen zwei.
- **Gegenbeispiele im Bild**: im geöffneten Satz «Dagegen: N Tage von M» mit den neuesten drei Tagen und Link zu «Gegenbeispiele» (`counterDays`, bestehend).
- **Heute-Zeile**: die Karte «Heute-Check» auf Heute zeigt den stärksten Hebel als eine Zeile mit Tipp («Mehr als 7 h Schlaf: Akku im Schnitt +3, Probier es heute: früher ins Bett»); ein Tipp öffnet Zusammenhänge. Der Code lädt erst nach dem Start (`await import`), Heute bleibt klein.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- «Wenig Schlaf» bleibt als «mehr als X h Schlaf … sonst …» (gleicher Vergleich).
- Die Wochentage zeigen nur bei klarem Unterschied (hohe Schwelle: 7 Tage × 5 Werte sind viele Chancen).
- «Bremsen» baue ich nicht (Noah wählte «2 und 3»).
- Die Heute-Zeile steht in der bestehenden Karte «Heute-Check» (kein neuer Block, Content first), nur wenn es einen Hebel gibt.
- Keine Änderung an Daten, Backup, Sync oder `api/`.

## Entscheide (eigene Datei `docs/decisions/zusammenhaenge-muster.md`)
- 23.11.2026: ein gebündelter PR für die Folge-Ideen (Bündler, Noah: wenige PRs).

## Stand im Plan (roadmap.md / vorhaben.md)
- Zusammenhänge-Ideen von Noah (23.11.2026): alle gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Körper › Zusammenhänge: oben «Neu diese Woche entdeckt» (wenn etwas neu ist), weiter unten «Wochentage» und «Erholung».
2. Einen Satz antippen: Bild, «Bester Bereich», «Dagegen: N Tage».
3. Heute: in «Heute-Check» eine Zeile mit dem stärksten Hebel; ein Tipp öffnet die Zusammenhänge.
