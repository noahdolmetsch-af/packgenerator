# Haken-Analysen an einem Ort: ein Schalter, Tagestotal, Wochenpensum

27.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» auf den Vorschlag «Haken-Analysen an einem Ort» (Thread «Abhaken auf einen Blick verbessern»), Paket A von drei

- Noah 27.11.2026 14:52: «wie war das tagestotal im vergleich zu anderen tagen? wochenpensum vgl. mit vorwoche» und «im idealfall hat der nutzer nur 1 ort, wo er diese analysen sieht».
- **1a** Auswerten › Woche ist der eine Ort für die Haken-Analysen (verworfen: ein eigener Reiter «Aktivität»).
- **2a** Ein gemeinsamer Schalter (10 Tage, 30 Tage, 3 Monate, Jahr) für alle Karten (verworfen: ein Schalter pro Karte). Er nimmt den Schlüssel des Haken-Verlaufs (`pg.hakenverlauf`) weiter, die bisherige Wahl bleibt also erhalten.
- **3a** Die alten Orte bleiben, mit einer Zeile «Alle Auswertungen ›» (Paket C).
- **5a** Reihenfolge: Paket A Tagestotal und Wochenpensum, Paket B Gesundheit, Paket C Aufräumen.
- Garmin gewinnt (Noah 27.11.2026 14:59): wird eine Aktivität von Garmin und Fitbit doppelt aufgezeichnet, zählt immer Garmin, nie doppelt. Die Erkennung baut der Thread «Wie war's?». Tagestotal und Wochenpensum rechnen mit den gemeinsamen Einheiten (`einheiten.js`) und übernehmen das Ergebnis, sobald es dort steht.
- **Tagestotal**: Minuten pro Tag, alle Aktivitäten zusammen, gemessen und «ca.» (übliche Dauer) getrennt gezeichnet. Der typische Trainingstag ist der Median der Trainingstage der letzten 90 Tage (ab 5 Trainingstagen). Höchstens 90 Tage: ein Jahr von Tagen ist zu dünn zum Lesen, Wochen stehen im Wochenpensum.
- **Wochenpensum**: Stunden pro Woche (Montag bis Sonntag), mindestens 12, höchstens 52 Wochen. Das Mittel ist der Durchschnitt der letzten 12 vollen Wochen (ab 4 Wochen mit Bewegung); «auf dem Mittel» heisst innerhalb von 10 Prozent. Nur Beobachtung, kein Urteil.
- Der Bericht darunter behält seinen eigenen Zeitraum (Woche, Monat, Jahr, Alles), weil er ganze Kalenderzeiträume zählt.
