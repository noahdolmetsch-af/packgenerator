# Zug hin, Velo heim

PR (diese Änderung) · 28.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N7

## Was ist neu
- Touren › Träume, unter dem Feierabend-Biwak: «Zug hin, Velo heim» (`src/lib/neuland/TrainHome.svelte`). Drei Gemeinden, in denen du nie warst, etwa so weit weg wie die gewählte Heimfahrt (40, 60, 80 oder 120 km), in verschiedenen Richtungen; zuerst die mit den meisten neuen Gemeinden rundum (`src/lib/neuland/zugheim.js`).
- «Züge und Heimweg» (`TrainHomeSheet.svelte`): die nächsten drei Züge vom Bahnhof beim Wohnort dorthin (transport.opendata.ch, wie «Nach Hause») und der Heimweg mit dem Velo (BRouter): km, Höhenmeter, Zeit.
- «Als Tour planen» macht eine Schnellstart-Tour mit dem Heimweg als Strecke und dem ersten Zug in der Notiz; «GPX für den Garmin».
- Neue Funktion im Katalog: `f.trainthere`.

## Was fällt weg oder rutscht tiefer
- Träume: «Alle Träume auf einer Karte», «Erfüllte Träume», «Weisse Flecken» und die Teile darunter rücken um diesen Teil nach unten.

## Selbst entschieden
- Gefragt wird nur beim Antippen, nie im Hintergrund; Wohnort und Ort gehen nur an den freien Fahrplan und den freien Velo-Router.
- Start sind Gemeinden (nicht Pässe oder Seen), weil dort fast immer ein Bahnhof oder Bus in der Nähe ist.
- «Neue Gegend» = viele noch nicht erreichte Gemeinden im Umkreis von 8 km.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 15 von 20 (N7). Als Nächstes N9 «Sonnenaufgang auf dem Hügel».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume: «Zug hin, Velo heim» zeigt drei Orte.
2. 80 km wählen: andere Orte erscheinen.
3. «Züge und Heimweg»: die nächsten Züge und die km nach Hause erscheinen.
