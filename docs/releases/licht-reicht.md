# Reicht dein Licht?

PR (diese Änderung) · 04.11.2026 · Noah 02.11. Vorschlag 4 («a»), 03.11. «freigabe bitte fortfahren»; Ziel 6 «Lange Fahrten unterwegs verstehen»

## Was ist neu
- Bei den «Stopps» der Live-Karte (mit Strecke) neu die Karte «Licht» (`lamp.js`): sie zählt die Stunden Dunkelheit zwischen jetzt und der Ankunft (ohne Ankunft: die nächsten 10 Stunden) und vergleicht sie mit dem, was dein Licht noch hat. Ein Satz sagt «reicht», «reicht knapp» oder «reicht nicht», mit «brennt bis etwa …».
- «Wie viel ist noch in deinem Licht?»: Voll, Halb, Fast leer. Unter «Licht ändern» stellst du ein, wie lange es mit voller Ladung brennt (Standard 10 Stunden). Beides bleibt in diesem Browser.
- Wird es nicht dunkel, steht das.

## Was fällt weg oder rutscht tiefer
- nichts. Eine Karte mehr zwischen «Nächstes Wasser» und der Stopps-Liste.

## Selbst entschieden
- 10 Stunden Brenndauer als Annahme; «reicht» mit einem Viertel Reserve (darunter «reicht knapp»). Alles änderbar.
- Dunkel zählt nach Sonnenauf- und -untergang am Standort (wie «Du kommst nach Einbruch der Dunkelheit an»), alle 10 Minuten geprüft.
- Das Handy-Akku-Feld (schon da) bleibt unverändert; diese Karte betrifft das Velolicht. Keine neue Funktion in `features.js`.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan
- Vorschlag 4 gebaut; danach Schritt 6 «Offline».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte mit Strecke starten, Stopps öffnen: die Karte «Licht» sagt, ob dein Licht reicht.
2. «Fast leer» antippen: der Satz ändert sich. «Licht ändern» öffnen und die Brenndauer einstellen.
