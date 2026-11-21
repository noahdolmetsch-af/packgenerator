# Untergrund der Anfahrt aus Kartendaten

PR (noch offen) · 07.11.2026 · Auftrag: Noah «1a 2a 3a 4b 5a» (Thread «Plane Entdecken und Sammeln»), Schritt 3b der Reihenfolge. Baut auf «Wege hierher» (#1087) auf.

## Was ist neu
- In der Box «Wege hierher» (Neuland › ein Ort) steht ein Abschnitt **«Untergrund der Anfahrt»** mit dem Knopf **«Untergrund nachschlagen»**.
- Ein Tipp fragt **OpenStreetMap** (Overpass, kostenlos, ohne Schlüssel) für die Anfahrt jedes Tages (die letzten 3 km vor dem Ort, die neusten sechs Tage auf einmal) und zeigt die Anteile: **Asphalt, Schotter, Naturboden, unbekannt**, z. B. «Asphalt 70 % · Schotter 30 %».
- Neue Dateien: `src/lib/neuland/untergrund.js` (Abfrage, Einordnung, Speicher), Abschnitt in `ItemWays.svelte`, Wort-Datei `neulanduntergrund.js`.
- `wege.js` liefert zu jedem Tag jetzt auch die Anfahrt als Linie (`run`), nur dafür.

## Was fällt weg oder rutscht tiefer
nichts. Die Box «Wege hierher» hat einen Abschnitt mehr, sie ist nur sichtbar, wenn ein Tag eine Anfahrt hat.

## Selbst entschieden
- **Nur nach einem Tipp, nicht von selbst** (Noah «4b» hiess «auch automatisch aus Kartendaten»: automatisch heisst hier: ohne dass du den Belag eintippst, nicht: ohne dass du es auslöst). Nur diese 3 km der eigenen Linie verlassen dann das Gerät, und der Text sagt es. Wie bei «Brunnen und Werkstätten an der Strecke». Wer es immer automatisch will, sagt es; das wäre eine kleine Änderung (beim Öffnen des Fensters nachschlagen).
- **Die Antwort bleibt auf dem Gerät** (`db.meta`, Schlüssel `neuland.untergrund.<Ort>`): nicht im Backup, nicht synchronisiert, kein neues Datenformat, keine Änderung am Schema. Danach geht es offline, und ein zweiter Tipp fragt nur nach den Tagen, die noch fehlen («Nochmals nachschlagen» fragt alle neu).
- **Grob mit Absicht**: alle 250 m (höchstens 16 Punkte) schaut die App, auf welchem Weg der Punkt liegt (bis 40 m daneben). Der Belag kommt aus dem Eintrag `surface`, sonst aus `tracktype`; Strassen ohne Eintrag zählen als Asphalt, Wege ohne Eintrag als «unbekannt». Viele Wege haben keinen Eintrag; die App rät dann nicht.
- Fehler sagen es ruhig: «Keine Verbindung», «Der Kartenserver ist ausgelastet», sonst «hat diesmal nicht geklappt». Was schon gespeichert ist, bleibt.
- Ein Untergrund **von Hand eintragen** ist ein eigener Schritt, weil er im Backup gespeichert werden müsste (Datenformat, erst mit einer Backup-Kopie prüfen).
- Teile der Fertig-Regel wie bei «Wege hierher»: keine eigene Seite, die Box gehört ins Fenster des Orts.

## Entscheide (für decisions.md)
nichts Neues.

## Stand im Plan
- Entdecken und Sammeln: Schritt 3 von 7 abgeschlossen (Wege hierher mit Seite, Sportart und Untergrund). Als Nächstes «Sammlungen mit Charakter».

## Prüfschritte (nach dem Merge auf der echten Seite, mit Netz)
1. Touren › Rückblick › Neuland › Alpenpässe: einen gefahrenen Pass öffnen. In «Wege hierher» auf «Untergrund nachschlagen» tippen.
2. Zu jedem Tag stehen Anteile, z. B. «Asphalt 70 % · Schotter 30 %»; unten der Hinweis zu OpenStreetMap.
3. Fenster schliessen, wieder öffnen (auch ohne Netz): die Anteile sind noch da.
