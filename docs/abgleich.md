# Was wird abgeglichen, was bleibt auf dem Gerät

Für Noah, in einfachen Worten. Stand 23.11.2026. Die Liste für die App steht in `src/lib/sync/geraet.js`, ein Test (`tests/abgleich-karte.test.js`) hält sie vollständig. In der App: Ich › Daten und Backup › «Was wird abgeglichen?».

## Die Regel
Alles, was du in der App eingibst oder änderst, liegt in der Datenbank des Geräts und geht in den Abgleich (nach ein paar Minuten, solange beide Geräte offen oder wieder online sind). Nur was in der Landkarte als «bleibt auf dem Gerät» steht, geht nicht.

## Geht aufs andere Gerät
Alle Tabellen der Datenbank (`DATA_TABLES` in `src/lib/db.js`): Material, Sets, Touren und Packlisten, Rückblicke, Velos und Pflege, Besuche, Fotos der Velos, Notizen, Fahrten, Im Flow (Aktivitäten, Haken, Meilensteine), Training und Gesundheit, Dokumente, eigene Spuren, Sportarten, Freie Zeit, und alle Einstellungen, die du selbst machst (zum Beispiel die Liste «Was mir gut tut», der Wochenplan, deine Listen und Typen).

## Bleibt auf dem Gerät, mit Grund
- **Verbesserungs-Logbuch** und seine Arten (Noah 21.11.2026).
- **Kopie der Google-Termine und -Aufgaben**: Google hat das Original, beide Geräte holen es selbst.
- **Private Links und Fotos**: Spielerplus-Kalender, TrainingPeaks-Kalender, Tennis-Flyer-Fotos, Kartenstreifen offline, das abgestellte Velo, Webcams, Tipps und Hilfe-Zustand.
- **Browser-Speicher des Geräts** (`localStorage`, `sessionStorage`), vier Arten:
  - *Ansicht*: wie eine Seite aussieht (Sprache, Farbe, Sortierung, Filter, zuletzt geöffnet).
  - *Gemerkt*: was dieses Gerät schon gezeigt hat oder was du weggetippt hast («Heute nicht», Tipps, Neuigkeiten).
  - *Laufend*: etwas, das gerade läuft oder zwischen zwei Seiten wartet (Timer, Rundgang, Live-Fahrt, Entwurf).
  - *Bewusst*: von dir so entschieden (Fragen, die die App nicht beantworten konnte; eigene Anordnung der Seiten).
  - *Privat*: Bezahlen, Strava-Schlüssel, Push, KI im Gerät.

Die Kleider-Auswahl «bleibt fürs Velo» (Kleider heute) lag im Browser-Speicher und liegt jetzt in den Einstellungen (`wardrobe.everydayKeep`): sie geht aufs andere Gerät, die Auswahl beider Geräte bleibt. Was auf dem alten Stand im Browser lag, wird einmal übernommen.

## Wenn beide Geräte gleichzeitig dasselbe ändern
Nichts geht verloren. Packlisten, Wochenplan-Haken und «Was mir gut tut» werden zusammengeführt: die Einträge und Haken beider Geräte bleiben. Bei allem anderen gilt die neuere Änderung; die andere Version wartet 30 Tage unter «Von selbst abgeglichen» und lässt sich zurückholen.

## Offen (Folgearbeit)
- Andere Listen als Einstellung (Heute-Anordnung, Listen und Typen) werden bei gleichzeitiger Änderung auf beiden Geräten nicht zusammengeführt, sondern die neuere gewinnt: Aufnahme in `merge.js`, sobald ein Fall belegt ist.
