# Rennatlas: eine richtige Karte

Auftrag: Noah 24.11.2026 («bilder mit richtiger karte bitte», dann «Karte bauen» auf der Entscheid-Karte), Thread «Bikepacking-Rennen: Stand und Ideen zeigen»; Vorbild: Mockup 3 «Zoom von Europa bis zur Route».

## Was ist neu
- Rennatlas › Karte zeigt jetzt drei Karten wie im Mockup: eine grosse (Zoom 3 «Schweiz» oder «Nahaufnahme») und daneben zwei kleinere (Zoom 2 «Alpen» oder «Weitere Umgebung», Zoom 1 «Europa»). Mit «+» und «−» wechselt man die Stufe; ein Tipp auf den Namen einer kleinen Karte macht sie zur grossen. Ein gestrichelter Rahmen zeigt auf jeder Karte, wohin der nächste Zoom geht.
- Auf der grossen Karte stehen Ortsnamen (Zürich, Bern, Chur …), die grossen Schweizer Seen und ein Massstab in km; die Länder mit Rennen sind grün, ihre Namen stehen in Grossbuchstaben.
- Die Umrisse sind jetzt fein (vorher grob und eckig); die Karte nimmt am Handy ein fast quadratisches Bild, am Computer ein breites.
- Die Punkte bleiben nummeriert (angemeldet kräftig, Favorit blasser, Überschneidung rot); Tippen öffnet das Rennen. Startorte ausserhalb Europas stehen in einer Zeile unter den Karten und in der Liste.

## Was fällt weg oder rutscht tiefer
- Die zwei festen Karten (Europa mit der Gegend und «Karte der näheren Region») fallen weg; die Zeile «Nur auf der Europakarte» ist ersetzt durch «Nicht auf den Karten (ausserhalb Europas)».
- Der Satz «Mit + und − zoomen …» steht neu unter der Überschrift der Karte (nur dort, nicht über dem Rest der Seite).

## Selbst entschieden
- Ortsnamen (rund 60, `src/lib/race/atlas-cities.js`) sind feste Orientierungspunkte wie die Länder; sie stehen nicht über `t()`, sind aber auf Deutsch und Englisch hinterlegt.
- Ortsnamen stehen nur auf der grossen Karte, die kleinen zeigen Länder und Rahmen (wie im Mockup). Ein Name, der auf eine Nummer oder auf einen anderen Namen fiele, bleibt weg.
- Nicht gebaut, weil die Datei die Angaben nicht hat: die Linien von Start zu Ziel, Kilometer-Marken und Startschleifen aus dem Mockup (brauchen Start- und Zielkoordinaten oder eine GPX-Datei je Rennen); Zwei-Finger-Zoom.
- Die Zoomstufen rechnen sich aus den Startorten: Zoom 1 ist immer Europa, Zoom 2 die weitere Umgebung der dichtesten Gruppe, Zoom 3 deren dichtester Teil. «Alpen» und «Schweiz» heissen die Stufen nur, wenn die Mitte in den Alpen liegt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rennen › Rennatlas › Karte: grosse Karte mit Ortsnamen und Massstab, zwei kleine daneben (am Handy untereinander).
2. «−» tippen: die weitere Umgebung kommt gross, die Nahaufnahme wandert in die Seitenleiste.
3. Eine Nummer antippen: das Rennen öffnet sich.
