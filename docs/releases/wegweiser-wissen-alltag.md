# Gut zu wissen im Alltag (Wegweiser 17: Inhalte Alltag)

PR #… · 02.11.2026 · Auftrag: Noah «1-5a» (Inhalte, Claude schreibt das Wissen, kurz mit etwas Humor) und Plan «freigabe» Schritt 1–26 (Thread «Entdeckbarkeit versteckter Funktionen planen»)

## Was ist neu
- Die Karte «Was du hier tun kannst» mit «Gut zu wissen» steht jetzt auf 19 Alltags-Seiten (35 Funktionen):
  - Dokumente, Werkzeuge und Links, Bild bearbeiten, Meine KI-Projekte, Fotoalbum
  - Ruhig und persönlich, Ausgeblendet und aus, Antwort mit Belegen, Weniger App (Arbeitsraum, Ruhige Ansicht)
  - Erinnerungen (Geburtstage und Pflanzen, eigene Erinnerungen)
  - Pflanzenpass, Mail als Vorgang, Erinnerungskarten
  - Freunde fragen, Mini-Werkzeuge (Termin finden, Umfrage, Anmeldeliste, Einladung, Wer isst was, Wann muss ich losfahren?, Fair auslosen), Projekt-Ablage, Mein Abend
- Wissen in `src/lib/wissen/alltag.js`, Deutsch in `src/lib/i18n/de/wissen-alltag.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Der Inhalt dieser 19 Seiten rutscht um die Karte tiefer, bis man sie mit × zuklappt.

## Selbst entschieden
- Nicht dabei: Sammelseiten mit Funktionen aus vielen Bereichen (Ich, Werkzeugkasten, Touren) und die Seiten anderer Bereiche (Planen, Zurück, Unterwegs). Die reinen App-Seiten (Aussehen, Listen, Verbindungen, Datenschutz, Neuigkeiten) bleiben für Schritt 20 «App».
- Erinnerungen aufs Handy und Daten und Sicherung bekommen die Karte nicht: sie haben 10 und 12 Funktionen, die Karte würde sie unter 2,5 Bildschirme schieben (Test «Heimat»). Diese Seiten erklären ihre Schalter schon selbst.
- Kochen hat sein Zuhause unter Alltag (`#/me/alltag`), das Schritt 13 «Planen» übernimmt.
- Bild bearbeiten hat im Werkzeugkasten noch kein «Gut zu wissen», darum gibt es keine Doppelung.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 «Wegweiser statt Katalog»: Schritt 17 von 26.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Dokumente öffnen: oben steht «Was du hier tun kannst», jede Funktion hat «Gut zu wissen».
2. Ich › Erinnerungen öffnen: auch dort steht die Karte; × klappt sie auf eine Zeile zu.
