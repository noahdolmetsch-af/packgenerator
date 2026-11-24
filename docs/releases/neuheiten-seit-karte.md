# Neuheiten am Ende von Heute

Auftrag: Noah «1b 2a 3a 4b 5a» (Thread «Neuheiten in der App besser zeigen»), Schritt 3 von 4 von Weg B. Baut auf `news-bilder` und `news-bilder-anzeige` auf.

## Was ist neu
- Am Ende von Heute steht die Karte «N Neuheiten seit Freitag». N zählt jede Zeile der Neuheiten (Hauptpunkte und Kleinigkeiten) aller Versionen seit deinem letzten Besuch, nicht nur der neuesten. Bis zu drei Bilder davon liegen als Streifen auf der Karte.
- «Neuheiten nach Ort ansehen» öffnet ein Fenster: die Neuheiten nach Ort gebündelt (Heute, Woche, Touren, Velos und Material, Auswerten, Wetter, Ich, Weitere Orte), die grösste Gruppe zuerst. Jede Gruppe klappt auf: ein Bild je Neuheit (mit Schieber vorher/nachher, wo es ein Vorher gibt), das Update und «Ausprobieren».
- Karte oder Fenster schliessen zählt alles bis zur neuesten Version als gesehen (`wasneu.card`, nur auf diesem Gerät, nicht im Backup). «Alles unter Ich › Was ist neu» bleibt am Ende des Fensters.
- Der Build trägt Ordner und Bilder jeder Neuheit in die kurze Zeile ein (`id`, `bilder`), so liest Heute nur diese Zeilen; das Fenster lädt die ganze Liste erst beim Tippen.

## Was fällt weg oder rutscht tiefer
- nichts. Der Hinweis «New in …» unter Ich und die Kachel «Neu» bleiben wie sie sind.

## Selbst entschieden
- Die Karte steht **unter** dem Inhalt von Heute (nach der Wand und der Km-Karte), nicht darüber wie im Entwurf B1: «Inhalt zuerst» (Noah 21.11.2026 «5a») verbietet neue Karten über dem Inhalt. Soll sie nach oben, ist es eine Zeile in `Home.svelte`.
- Ab wann gezählt wird: ab der Version, die du zuletzt angesehen hast (`wasneu.card`); gibt es das noch nicht, ab der Version vor dem letzten Update dieses Geräts. Ein erster Start ohne Update zeigt keine Karte.
- Die Karte nennt keine Orte mit Zahlen (Entwurf: «Velos 6 · Analyse 5»): die Orte stehen im Fenster. So muss Heute die ganze Liste nicht laden.
- Der Ort einer Zeile kommt aus dem Ziel von «Ausprobieren» (`nav.js` pageOf/placeOf); eine Zeile ohne Ziel steht unter «Weitere Orte».
- Auf einem Gerät ohne Daten (leere Heute-Wand) erscheint die Karte nicht.
- Nach der impeccable-Prüfung (Noah 24.11.2026): «seit heute»/«seit gestern» statt des Wochentags, wenn der Tag heute oder gestern ist; im Fenster ist der erste (grösste) Ort offen; unter den Zeilen steht «heute», «gestern» oder Tag und Monat, keine Versionsnummer.
- Das Fenster sieht aus wie der Rest der App (Ich › Was ist neu): jeder Ort eine Karte, die Zeilen auf dem weichen Feld mit Icon, die Zahl als farbiger Kreis, «Ausprobieren» in der Hauptfarbe.
- Offen für später: die Zeile «Seit deinem letzten Besuch» in `clear/comeback.js` zählt noch Versionen, nicht Neuheiten.

## Entscheide (eigene Datei)
- keine neuen; Grundlage `docs/decisions/news-bilder.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Neuheiten besser zeigen (Weg B): Schritt 3 (Karte nach Ort) fertig; folgt: Pflicht per Test und Regel in CLAUDE.md.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute bis ans Ende scrollen: die Karte «N Neuheiten seit …» mit Bildern.
2. «Neuheiten nach Ort ansehen»: Gruppen mit Zahl; eine aufklappen, Bild und «Ausprobieren» probieren.
3. Fenster schliessen: die Karte ist weg, bis es ein neues Update gibt.
