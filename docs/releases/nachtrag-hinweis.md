# Gestern nichts abgehakt? Nachtragen: ein ruhiger Hinweis am Morgen

PR #1386 · 21.11.2026 · Auftrag: Noah 21.11.2026 (Festlegung Abhaken, Punkt 5 «Nachträglich abhaken»), Thread «Training erfassen vereinfachen». Baut auf «Gestern nachtragen» (Abhak-Fenster mit «Wann») auf.

## Was ist neu
- Auf Aktiv steht vor 12 Uhr unter «Ruhetag»-Hinweis (falls da) und über «Heute abhaken» eine ruhige Zeile: «Gestern nichts abgehakt? Nachtragen.» «Nachtragen» zeigt die Kacheln; ein Tipp auf eine öffnet ihr Abhak-Fenster mit «Gestern» schon gewählt.
- «Heute nicht» blendet den Hinweis für den Tag aus (auf diesem Gerät).
- Er erscheint nur, wenn in den letzten zwei Wochen etwas abgehakt wurde und gestern nichts. Wer neu ist oder lange Pause hatte, sieht ihn nicht.

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Keine Datenänderung: «Heute nicht» steht nur im Gerät (`localStorage` «nachtragNo»), nicht in der Datenbank und nicht im Backup.
- Nur auf Aktiv, nicht auf Heute: Die Seite Heute baut der Prototyp-Thread um; der Hinweis zieht dorthin, wenn die Liste «Heute dran» (nächster Schritt) steht.
- Ein Wochenplan-Häkchen von gestern zählt noch nicht als «abgehakt»; das ändert «Ein Haken für alles».
- Fertig-Regel: Seite unverändert (Aktiv), Absprung: der Hinweis selbst; «Gut zu wissen» unverändert; leerer Zustand unverändert; nächster Schritt: das Abhak-Fenster; App-Stand (Zeile «Aktiv» ergänzt).

## Entscheide (eigene Datei `docs/decisions/nachtrag-hinweis.md`)
- 21.11.2026: Der Morgen-Hinweis erscheint nur, wenn zuletzt etwas abgehakt wurde, und bis 12 Uhr (Noah: «morgens ruhiger Hinweis»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Vereinfachen, Schritt 1 (Nachtragen): Abhak-Fenster und Morgen-Hinweis fertig; «mehrere Tage in einem Rutsch» und «Heute · Gestern» folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv öffnen, wenn du gestern nichts abgehakt hast und vor 12 Uhr: Über «Heute abhaken» steht «Gestern nichts abgehakt? Nachtragen.»
2. «Nachtragen» tippen, eine Kachel wählen: Das Fenster zeigt «Gestern» gewählt; «Abhaken» speichert für gestern, der Hinweis verschwindet.
3. «Heute nicht» tippen: Der Hinweis ist weg, auch nach dem Neuladen.
