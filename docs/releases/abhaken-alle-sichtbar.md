# Jede Aktivität auf Heute, auf einen Blick

PR #<Nummer> · 27.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Abhaken auf einen Blick verbessern», Schritt 1 von 3)

## Was ist neu
- «Heute abhaken» auf Heute zeigt **alle** Aktivitäten als kleine Felder (Handy: drei pro Reihe, Computer: so viele wie passen). Vorher standen am Handy nur 4 und am Computer 8 da, der Rest hinter «Alle ›»; die Aktivitäten, die auch als Gewohnheit oben stehen, waren nur in einer Zeile genannt.
- Die Kopfzeile des Blocks zählt «x von y» (heute abgehakt von allen).
- Der Chip «Abhaken» unter dem Gruss entfällt, solange der Block da ist; nimmt man den Block von Heute, ist der Chip wieder da.
- Ein Feld: Tipp hakt ab, nochmals Tipp nimmt zurück, «Rückgängig» wie bisher; langes Drücken öffnet Dauer, Ort oder Stoppuhr.

## Was fällt weg oder rutscht tiefer
- Das «•••» am Feld auf Heute (Ersatz: langes Drücken, Rechtsklick, Menütaste; auf Aktiv bleibt es).
- Die Zeile «Gym, Kaltwasser, Freunde: oben bei deinen Gewohnheiten» (Ersatz: diese Aktivitäten stehen jetzt im Raster).
- Der Chip «Abhaken» unter dem Gruss (Ersatz: der Block direkt darunter).

## Selbst entschieden
- Fertig-Regel: Seite und Absprung bestehen schon (Heute, Aktiv); kein «Gut zu wissen», keine neue Seite, kein leerer Zustand neu (der Block fehlt wie bisher ohne Aktivitäten, dort steht die Karte «Aktiv heute»).
- Feldhöhe 48 px und Schrift 12 px am Handy, damit 21 Aktivitäten (Noahs Menge) mit Favoriten-Zeile und ohne Chip in einen Bildschirm passen; Namen brechen mit Silbentrennung statt abgeschnitten.
- «Aktiv heute» zeigt jetzt nur noch Aktivitäten, die heute ruhen (alle anderen sind im Block).
- Der «offen»-Zähler im Block entfällt; die Zahl «offen» bleibt im Menü bei «Plan».

## Entscheide (eigene Datei `docs/decisions/abhaken-alle-sichtbar.md`)
- 27.11.2026: Variante A Raster, Chip «Abhaken» entfällt, Reihenfolge der Schritte 1a bis 5a.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung (Schritt 1 von 3: Raster auf Heute; Haken-Verlauf und Hinweise folgen als eigene PRs).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: «Heute abhaken» zeigt jede Aktivität (Handy drei pro Reihe), oben «x von y».
2. Ein Feld tippen: abgehakt, Zähler +1; «Rückgängig» oder nochmals tippen nimmt zurück.
3. Ein Feld lange drücken: das Fenster für Dauer, Ort oder Stoppuhr öffnet sich.
4. Unter dem Gruss steht kein Chip «Abhaken» mehr.
