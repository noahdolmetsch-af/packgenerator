# Bild oben auf Heute

PR #939 (ersetzt #783, neu auf `main` aufgesetzt, weil #783 einen Konflikt hatte) · 03.11.2026 · Noah 03.11. «a» (Paket G, Teil 1; Thread «Durchgehen: offene Fragen einzeln»); Ziel 5 «Alltag»

## Was ist neu
- Oben auf Heute steht eine gezeichnete Landschaft (Hügel, Sonne oder Mond, ein kleines Velo auf der Strasse) mit deiner nächsten Tour und dem Countdown: «Noch 12 Tage bis Bodensee-Runde», «Morgen geht es los: …», «Heute: …» oder «… Tag 2 von 3». Darunter in einer kleinen Zeile das Wetter von Heute (wie unter dem Gruss).
- Die Farben des Himmels folgen der Tageszeit (Morgen, Tag, Abend, Nacht nach der einen Tagesuhr der App) und werden grau, wenn das Wetter Regen erwartet. Nachts bleibt der Nachthimmel mit Mond und Sternen.
- Ein Tipp auf das Bild öffnet die Tour (wie die Tourkarte).
- Neuer Schalter unter Ich › Darstellung › Bedienung: «Bild oben auf Heute» (Standard: an). Aus = das Bild ist weg.
- Das Bild steht still (nichts bewegt sich); «Bewegung reduzieren» ändert deshalb nichts.
- Das Bild kommt nur, wenn eine Tour mit Datum noch bevorsteht oder gerade läuft; sonst fehlt es. Beim Anpassen von Heute («Startseite anpassen») ist es ausgeblendet.

## Was fällt weg oder rutscht tiefer
- nichts. Die Tourkarte mit Countdown, Schritten und Knöpfen bleibt wo sie war; das Bild kommt davor dazu. Der Gruss steht jetzt unter dem Bild.

## Selbst entschieden
- Das Bild ist ein Band über dem Gruss (nicht an dessen Stelle), damit der Gruss, das Wetter und «Was ziehe ich an?» bleiben; die Tourkarte bleibt unverändert.
- Es zeigt die nächste bevorstehende Tour (`soonTrips`), nicht die Tour mit offenem Rückblick; nach der Tour verschwindet es, bis die nächste mit Datum geplant ist.
- Als Schalter in «Bedienung», keine eigene Funktion im Katalog (Zusatz ohne eigene Seite, Fertig-Regel 1 bis 5 entfallen).
- Die Zeile «Sa trocken, So Regen ab Mittag» aus dem Entwurf gibt es hier noch nicht: es erscheint das Wetter von Heute (vorhanden und geprüft); Wetter pro Tourtag wäre ein späterer Schritt.
- Mond und Sterne nachts und eine Regenwolke bei Regen sind meine Ergänzung zu «Farben nach Tageszeit oder Wetter».
- Der Konflikt von #783 (Schalter-Liste in `bedienung.js`, `tests/bedienung.test.js`, Imports und Kopf in `Home.svelte`, wegen Nussgipfel, Murmeltier, Mundart, Kuhglocke und Ziehen-zum-Aktualisieren auf `main`) ist gelöst: beide Seiten bleiben, der Schalter steht hinter «Mundart».
- `docs/app-stand.md`: die Zeile «Heute» nennt jetzt das Bild oben.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket G «Heute persönlicher und ruhiger»: Teil 1 (Bild oben) gebaut; Teil 2 («ein starker Knopf», zuerst nur Heute) folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen (mit einer geplanten Tour): oben steht eine gezeichnete Landschaft mit «Noch … Tage bis …».
2. Ein Tipp auf das Bild öffnet die Tour.
3. Ich › Darstellung › Bedienung: «Bild oben auf Heute» ausschalten: das Bild ist weg.
