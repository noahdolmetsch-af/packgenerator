# Velo-Wissen dort, wo du es brauchst (Wegweiser 19: Inhalte Velo)

PR · 02.11.2026 · Auftrag: Noah «1-5a» (Inhalte, Claude schreibt das Wissen, kurz mit etwas Humor) und Plan «freigabe» Schritt 1–26 (Thread «Entdeckbarkeit versteckter Funktionen planen»)

## Was ist neu
- Die Karte «Was du hier tun kannst» mit «Gut zu wissen» steht jetzt auf 24 Seiten des Bereichs Velo: Velos und ihre Reiter (Velopflege: Verschleiss, FAQ, Spick, Saison, Verkauf, Jahresrückblick …; Vergleich; Setup mit Taschenplan und Setup-Logbuch; Werkstatt), Material, Ausrüstung, Kleider, Ski-Pflege und Werkstätten und Guides.
- 68 Funktionen mit einem kurzen Tipp (`src/lib/wissen/velo.js`, Deutsch in `src/lib/i18n/de/wissen-velo.js`): Kettenverschleiss, Reifendruck, Drehmoment, Lagerung, Gewicht.

## Was fällt weg oder rutscht tiefer
- Nichts fällt weg. Der Inhalt dieser Seiten rutscht um die Höhe der Karte tiefer, bis man sie mit × zuklappt (pro Seite gemerkt). Auf Velos und Material (am Handy wie am Computer) startet die Karte darum zugeklappt als eine Zeile, damit die Hauptknöpfe auf dem ersten Bildschirm bleiben; ein Tipp öffnet sie, die Wahl bleibt gemerkt.

## Selbst entschieden
- Nicht auf der Velopflege-Übersicht (`#/bikes?tab=care`): dort schob die Karte am Handy «Alle Tipps» zu weit nach unten (Test «Heimat»). Ihre Unterseiten haben die Karte.
- Nicht auf Sammelseiten mit Funktionen aus vielen Bereichen (`#/me/tools`, `#/me/push`) und nicht auf Heute.
- Werkzeuge Übersetzung, Wasserwaage und Strichcode haben keine eigene Heimseite mit Funktionen; ihr «Gut zu wissen» bleibt auf der Werkzeug-Seite.
- Drehmoment ohne feste Zahlen: das Teil und seine Aufschrift gelten. Kettenverschleiss nur als «viele Werkstätten wechseln bei etwa 0,5 %».
- Velos und Material starten zugeklappt (`FOLDED_FIRST` = Unterwegs, Packen, Velos, Material), so wie Noah es am 02.11.2026 08:21 mit «a» festgelegt hat.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 «Wegweiser statt Katalog»: Schritt 19 von 26.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos › Velopflege › Verschleiss öffnen: oben steht «Was du hier tun kannst», jede Funktion mit «Gut zu wissen».
2. Material öffnen: oben steht eine Zeile «Was du hier tun kannst». Ein Tipp darauf öffnet die Karte, ein Tipp auf × klappt sie wieder zu; das bleibt nach dem Neuladen so.
