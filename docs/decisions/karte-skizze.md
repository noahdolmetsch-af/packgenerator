# Karte der App: Skizze nach der Leiste, «geöffnet» pro Gerät

23.11.2026 · Auftrag: Noah «1a 2b 3a 4a 5a» (Thread «Versteckte Inhalte auffindbar machen»)

- **4a** Das Auffangbecken ist die bestehende Karte der App am selben Ort (Ich › Karte der App), neu als Skizze mit Punkten und Filtern; Einstieg von Heute («Alle Bereiche»), der Suche und Ich. Kein neuer Platz in der Leiste, am Handy bleiben es fünf (verworfen: ein eigener Platz «Entdecken»).
- **5a** «Geöffnet» wird pro Gerät gezählt, in einem schon bestehenden Einstellungsfeld, ohne Änderung am Datenspeicher oder am Backup-Format (verworfen: im Backup, auf beiden Geräten gleich).
- Die Orte der Karte werden aus `nav.js` gelesen und nie von Hand gepflegt (so folgen sie V9 bis V11 und «Mein Tag» von selbst).
- **V5 (Noah «1-5a»):** Die Suche nimmt den Ort einer Seite aus derselben Quelle wie die Leiste (`nav.js`, nicht `menu.js`); ein Wächter-Test prüft, dass jede Seite genau einen Ort hat. Die Orte-Liste der Karte und der Suche ist dieselbe.
