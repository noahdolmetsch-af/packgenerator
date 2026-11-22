# Challenges: die Frage alle 10 Tage

Auftrag: Noah 21.11.2026 («alle 10 Tage fragen nach Challenges, Meilensteinen, verrückten Ideen»), Ort gewählt 22.11.2026 01:50 UTC («c»: Mitteilung aufs Handy plus Karte auf der Seite «Challenges»). Thread «Challenges in den Vordergrund stellen». Schritt 4 von 4.

## Was ist neu
- Oben auf der Seite «Challenges» steht alle 10 Tage die Karte «Zeit für einen Blick» mit drei Knöpfen: «Challenge» (öffnet das Fenster für eine neue), «Meilenstein» (öffnet Meilensteine), «Verrückte Idee» (öffnet «Meine Ideen»), und «Später».
- Ein Knopf zählt als Antwort: die nächste Frage kommt in 10 Tagen. «Später» fragt morgen wieder; die Antwort von vorher bleibt.
- Neue Mitteilung aufs Handy «Challenge-Frage» (Ich › Erinnerungen aufs Handy, Gruppe «Alltag», aus bis du sie einschaltest): einmal um 18:00 am Tag, an dem die Frage fällig ist. Ein Tipp öffnet die Seite «Challenges».

## Was fällt weg oder rutscht tiefer
- Nichts. Heute bleibt, wie es ist (Noah 22.11.2026: auf Heute fällt nichts weg, Geplantes darf dazukommen): die Frage steht nicht auf Heute.

## Selbst entschieden
- Neue Einstellung `challengeask` mit zwei Tagen (`last`, `later`); Backup und Geräteabgleich nehmen sie wie jede Einstellung mit. Wegen der Daten: Einzelfreigabe.
- Noch nie gefragt = die Karte erscheint beim ersten Öffnen der Seite; die Mitteilung kommt dann am selben Tag um 18:00, falls sie eingeschaltet ist und die Zeit noch vor 18:00 liegt.
- Eine unbeantwortete Frage wird nicht jeden Tag wiederholt: die Mitteilung kommt nur am Fälligkeitstag, die Karte wartet auf der Seite. So drängt nichts.
- Der Test `push-schedule.test.js` (Winter-Pflanze) sucht den Pflanzen-Eintrag jetzt gezielt statt «den ersten», weil bei allen Schaltern an die neue Frage früher am Tag dran sein kann. Die Erwartung (11 Tage Winter) ist gleich.
- Fertig-Regel: Seite (Teil von `f.challenges`), Absprung (Mitteilung öffnet die Seite), Inhalt (Handbuchtext), leerer Zustand (Karte nur wenn fällig), nächster Schritt (die Knöpfe führen weiter), App-Stand (Satz bei «Challenges»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Meilensteine › «Challenges ›»: oben die Karte «Zeit für einen Blick» mit drei Knöpfen und «Später».
2. «Später» tippen: die Karte ist weg. «Meilenstein» tippen: Meilensteine öffnen sich, die Karte kommt erst in 10 Tagen wieder.
3. Ich › Erinnerungen aufs Handy › Gruppe «Alltag»: der Schalter «Challenge-Frage» ist da und aus.
