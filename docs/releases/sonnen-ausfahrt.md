# Sonnen-Ausfahrt über dem Nebel

Auftrag: Noah «1-5a» (Thread «Entwickeln: Über die Nebelgrenze motivieren», Variante A der Ideen A bis E). Dieser PR baut nur A. C, D folgen als eigene PRs, B und E sind zurückgestellt (5a).

## Was ist neu
- Auf Heute, direkt unter der Nebelzeile, eine Karte «Sonne über dem Nebel». Sie nennt eine deiner gespeicherten Fahrten, die über den Nebel führt, mit Länge, Höhenmetern und höchstem Punkt. Dazu der späteste Start, der km, ab dem du in der Sonne fährst (mit Uhrzeit), und wann sich der Nebel auflöst.
- Knöpfe: «Fahrt öffnen» (die Fahrt in der Planung), «Auf der Webcam ansehen» (deine Heimat-Webcam aus «Meine Webcams», sonst bergfex), «Andere Fahrt» (wenn mehrere passen), «Heute nicht» (Karte für den Rest des Tages weg).
- Ohne passende Fahrt: «Über dem Nebel scheint die Sonne, aber keine deiner gespeicherten Fahrten in der Nähe reicht hinauf.» mit «Fahrt planen».
- Schalter «Auf Heute eine Fahrt über dem Nebel vorschlagen» in der Wetterseite unter «Nebelgrenze einstellen» (Standard an).

## Was fällt weg oder rutscht tiefer
- nichts. Die Nebelzeile bleibt. Die Karte erscheint nur an passenden Tagen; was darunter steht, rutscht dann um die Höhe der Karte tiefer.

## Selbst entschieden
- Wann die Karte erscheint (2a): Nebel mit Sonne darüber, dein Ort im Nebel, und der Nebel hält noch mindestens 2 Stunden. Hält der Nebel bis zum Abend, endet das Fenster um 16 Uhr (kurzer Wintertag).
- Welche Fahrten: gespeicherte Touren mit Route, Start höchstens 60 km vom Wohnort (wie beim 07:00-Push), Route steigt mindestens 100 m über die Nebelgrenze, startet im Nebel und dauert höchstens 5 Stunden. Die nächste zuerst, ein Name nur einmal.
- Zeitrechnung wie bei «Überraschungsrunde» (19 km/h plus 1 h pro 600 Hm). Der späteste Start lässt mindestens 1 Stunde Sonne vor dem Auflösen, auf 5 Minuten abgerundet. Die Anfahrt vom Wohnort zum Start ist nicht eingerechnet. Bleibt der Nebel, gibt es keinen spätesten Start, die Zeiten gelten für einen Start in 15 Minuten.
- «Fahrt öffnen» statt «Los» (öffnet die Fahrt in der Planung, wo auch das Nebelband im Höhenprofil steht); die Karte sagt nicht, dass du fahren sollst.
- «Heute nicht» gilt für den Kalendertag am Wohnort. Die Karte nutzt die gemeinsame Luftschicht-Abfrage (`profil.js`), es gibt keine neue Abfrage.
- Keine neue Funktion in `features.js`: gehört zu «Weather for a ride» (Wetter). Nur Suchwörter ergänzt.
- Ein Webcam-Knopf, kein Webcam-Bild auf der Karte (das Heimat-Bild steht schon in der Wetterzeile darüber).
- Nicht enthalten, kommen als eigene PRs: Erholung und Wochenziel (C), Nebelmeer-Erinnerung (D). Zug (B) und zweite Nachricht (E) zurückgestellt.

## Entscheide (für decisions.md)
- 06.11.2026: Sonnen-Ausfahrt-Karte auf Heute, mit Zeitfenster, nur bei Sonne über dem Nebel und Nebel ≥ 2 Stunden (Noah «1a 2a»). Erholung (C) leise ja, Nebelmeer-Erinnerung ohne Serie (D), Zug und zweite Nachricht später (Noah «3a 4a 5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter: Idee «Nebelgrenze motiviert» Schritt A umgesetzt; C und D folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Wetterseite › «Nebelgrenze einstellen»: der Schalter «Auf Heute eine Fahrt über dem Nebel vorschlagen» steht da und ist an.
2. An einem Nebelmorgen mit Sonne darüber (die Nebelzeile auf Heute sagt «darüber Sonne» und «Dein Ort liegt im Nebel»): Heute zeigt unter der Zeile die Karte «Sonne über dem Nebel» mit einer Fahrt von dir. Das setzt eine gespeicherte Fahrt mit Route in der Nähe voraus.
3. «Fahrt öffnen» öffnet die Fahrt in der Planung; «Heute nicht» lässt die Karte für den Tag verschwinden.
4. Vergleiche die Angaben mit der Webcam: «Auf der Webcam ansehen» (Wie hoch der Nebel wirklich steht, sagt dir nur das Bild.)
