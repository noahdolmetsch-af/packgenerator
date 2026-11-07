# Wie wird gerechnet? bei der Cardio-Belastung

Auftrag: Noah «1a 2a 3a 4a 5b und alle A-F» 07.11.2026 (Thread «Cardio-Belastung: Ideen A–F bauen»), Idee D aus dem UI-Test der Analyse-Seite.

## Was ist neu
- Auf der Seite Cardio-Belastung steht unter dem Verlauf das Fach «Wie wird gerechnet?» (eingeklappt). Es zeigt die vier Pulszonen mit ihrem Gewicht (leicht ×1, mittel ×2, hart ×3, Spitze ×4) und rechnet einen echten Tag vor, z. B. «60 Min. leicht ×1 + 12 Min. mittel ×2 + 4 Min. hart ×3 = 96 Punkte».

## Was fällt weg oder rutscht tiefer
- nichts. Der Satz «Eigene Rechnung der App …» unter dem Titel bleibt.

## Selbst entschieden
- Das Beispiel ist der neuste Tag des gewählten Zeitraums mit Minuten in einer Zone, damit die Zahl zu deinen Daten passt. Ohne solchen Tag steht «Zum Beispiel: 30 Min. leicht ×1 + 10 Min. mittel ×2 = 50 Punkte».
- Nur bei der Cardio-Belastung: die anderen eigenen Rechnungen (Schlaf-Index, Unruhe im Schlaf) haben ihren Satz unter dem Titel; ein Fach mit Beispiel dafür wäre ein eigener Schritt.
- Die Gewichte stehen an einer Stelle (`LOAD_WEIGHTS` in `src/lib/analyse/own.js`): die Rechnung und die Erklärung können nicht auseinanderlaufen.
- Nur Anzeige, nichts wird bewertet.

## Stand im Plan (roadmap.md / vorhaben.md)
- Ideen A–F für Cardio-Belastung: D gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Analyse › Cardio-Belastung: unter dem Verlauf «Wie wird gerechnet?» antippen.
2. Vier Zonen mit Gewichten und ein Beispiel mit deinen Minuten.
3. Analyse › Ruhepuls: dort gibt es das Fach nicht.
