# Gestern auch auf Heute: der Morgen-Hinweis oben in «Jetzt dran»

PR #1441 · 22.11.2026 · Auftrag: Noah 22.11.2026 (Variante b), Thread «Training erfassen vereinfachen». Baut auf «Gestern nichts abgehakt? Nachtragen» (Aktiv) auf.

## Was ist neu
- Auf Heute steht vor 12 Uhr ganz oben in «Jetzt dran» die ruhige Zeile «Gestern nichts abgehakt? Nachtragen.» «Nachtragen» zeigt die Kacheln; ein Tipp auf eine öffnet ihr Abhak-Fenster mit «Gestern» schon gewählt.
- «Heute nicht» blendet sie für den Tag aus, auf Heute und auf Aktiv zugleich (auf diesem Gerät).
- Dieselben Regeln wie auf Aktiv: nur wenn in den letzten zwei Wochen etwas abgehakt wurde und gestern nichts.

## Was fällt weg oder rutscht tiefer
- Nichts. Auf Heute kommt eine Zeile dazu, sonst ändert sich nichts.

## Selbst entschieden
- Dasselbe Bauteil wie auf Aktiv (`NachtragHint`), keine zweite Regel. Die Aktiv-Kacheln («Jetzt dran» kennt keine eigenen) kommen aus denselben Daten wie auf Aktiv, ohne Ruhetage.
- Keine Datenänderung, kein Backup-Format: «Heute nicht» steht nur im Gerät.
- Fertig-Regel: Seite Heute (Zeile im App-Stand ergänzt); Absprung: der Hinweis selbst; «Gut zu wissen» unverändert; leerer Zustand unverändert (ohne Abhak-Verlauf kein Hinweis); nächster Schritt: das Abhak-Fenster.

## Entscheide (eigene Datei `docs/decisions/heute-nachtrag.md`)
- 22.11.2026: Nur der Morgen-Hinweis kommt auf Heute, keine Kacheln und keine Gestern-Zeile den ganzen Tag (Noah «b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Vereinfachen, Schritt 1 (Nachtragen): Abhak-Fenster, Morgen-Hinweis, mehrere Tage, Plan zuerst und «Heute · Gestern» fertig; «Ein Haken für alles» folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen, wenn du gestern nichts abgehakt hast und vor 12 Uhr: Oben in «Jetzt dran» steht «Gestern nichts abgehakt? Nachtragen.»
2. «Nachtragen» tippen, eine Kachel wählen: Das Fenster zeigt «Gestern» gewählt; «Abhaken» speichert für gestern, die Zeile verschwindet.
3. «Heute nicht» tippen: Sie ist auf Heute und auf Aktiv weg. Alles andere auf Heute steht wie vorher.
