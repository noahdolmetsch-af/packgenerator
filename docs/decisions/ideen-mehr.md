# Ideen gehen nicht aus: mehrere Tipps pro Bereich

27.11.2026 · Auftrag: Noah («ich kann nicht mehr ideen laden. bitte verbessern», mit Bild von Auswerten › Verlauf › Ideen)

- Jeder Balance-Bereich hat sechs Tipps (`src/lib/ideentipps.js`) statt einen. «Andere Idee» zeigt den nächsten; «Mag ich» legt den Tipp in die Ideenliste und zeigt den nächsten. Das Gerät merkt sich pro Bereich, wo man steht (Einstellung `ideas.tipIx`, im Backup).
- Ein Tipp, der schon in deinen Ideen steht, wird übersprungen. Stehen alle sechs schon drin, sagt die Karte das.
- Die weiteren Bereiche sind volle Karten mit «Mag ich» und «Andere Idee» (ohne «Jetzt nicht»; das Ausruhen gilt nur für die drei schwächsten).
- «Rückgängig» nach «Mag ich» nimmt auch die Stelle im Tipp-Stapel zurück.
- Der Pfad über «Ideen» (Computer) nennt die Seite nur einmal: `Crumb` der Aktiv-Seiten bekommt auf dem Computer den Seitennamen mit (`fitSteps`, wie bei F-10).
