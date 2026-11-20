# TrainingPeaks-Plan in deiner Woche

Auftrag: Noah «1a 2b 3a 4a 5b» (Thread «Bauen: TrainingPeaks-Plan und Zwift»), Schritt P2. Der Server-Teil (P1) ist schon online.

## Was ist neu
- Ich › Verbindungen: neue Karte «TrainingPeaks-Plan». Link einfügen (`https://` oder `webcal://`), «Testen und hinzufügen», an/aus, «Neu abrufen», «Entfernen» (mit Rückgängig). Der Link bleibt nur auf dem Gerät (nicht im Backup, nicht im Abgleich) und wird verborgen gezeigt.
- Ohne Link sagt die Karte in vier Schritten, wo man den Link in TrainingPeaks findet.
- Jedes dort geplante Training wird eine geplante Einheit in Training › Meine Woche, markiert mit «TP». Sportart aus dem Titel (Bike/Rad → Velo, Run/Lauf → Laufen, Hike/Wander → Wandern, sonst «Anderes»), Dauer aus Start und Ende oder aus der Beschreibung, Zone nur, wenn genau eine klar genannt wird.
- Einträge ohne Dauer werden nicht geraten, sondern weggelassen; die Karte sagt, wie viele.
- Die App ruft beim Öffnen höchstens alle 60 Minuten ab. Der Feed zeigt etwa 5 Tage zurück und 14 voraus und ändert sich bis zu 24 Std verzögert; das steht auf der Karte.
- In Meine Woche ohne TrainingPeaks-Einheiten steht ein kleiner Link «Plan in TrainingPeaks? Hier einlesen».

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Eine geplante Einheit, die Noah ändert, abhakt oder herausnimmt, bleibt wie sie ist: die App merkt sich pro Einheit, was der Feed zuletzt gesagt hat (nur auf dem Gerät, `settings.trainingpeaks.seen`), und fasst Änderungen von Hand nie an. Eine herausgenommene Einheit kommt nicht wieder.
- Auf einem zweiten Gerät (ohne diese Merkliste) wird nichts überschrieben und nichts doppelt angelegt.
- «Entfernen» nimmt auch die noch offenen, zukünftigen TrainingPeaks-Einheiten aus dem Plan; abgehakte und vergangene bleiben. Das steht im Fenster, mit Rückgängig.
- Keine neue Datenstruktur, kein Dexie-Schema: die Einheiten liegen wie alle anderen in `training.plan` (mit `src: 'tp'`), die Karte im Geräte-Setting `trainingpeaks`.
- Die genaue Form von Noahs Link ist nicht geprüft; `webcal://` wird wie `https://` gelesen.
- Der Platzhalter «intervals.icu / TrainingPeaks» in `src/lib/flowsugg.js` bleibt unverändert («later»): er beschreibt eine Kurve für Form und Last, nicht den Plan.
- «Passt hier»-Zeile nicht genutzt (sie verlangt 2 bis 4 Funktionen); der Absprung ist der Link in Meine Woche.

## Entscheide (für decisions.md)
- 19.11.2026: Die Einheiten aus TrainingPeaks gehören Noah, sobald er sie anfasst; der Feed überschreibt nie von Hand Geändertes (Noah «2b», Umsetzung).

## Stand im Plan (roadmap.md / vorhaben.md)
- TrainingPeaks-Plan und Zwift: P1 und P2 fertig; P3 Zwift/Indoor und P4 Plan gegen Fahrt folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Verbindungen: Karte «TrainingPeaks-Plan», eigenen Link einfügen, «Testen und hinzufügen».
2. Training › Meine Woche: die geplanten Trainings stehen an ihren Tagen mit «TP».
3. Eine Einheit ändern, dann «Neu abrufen»: sie bleibt, wie du sie gemacht hast.
