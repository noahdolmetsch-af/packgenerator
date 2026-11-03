# Neue Träume-Seite

PR (diese Änderung) · 02.11.2026 · Auftrag: Noah «für den nutzer unverständlich … vorschlag» und «1a 2a 3a 4a 5a»

## Was ist neu
- Touren › Träume: ein ruhiger Satz statt des langen Einleitungstextes (`src/pages/Dreams.svelte`).
- Umschalter «Liste / Karte / Jahr / Erfüllt» (Noah «5b»): die Liste ist die Hauptsache; «Alle Träume auf einer Karte» und «Dein Jahr» sind Ansichten statt Blöcke untereinander.
- Der Stand eines Traums (passt jetzt, trocken Do–Sa, erfüllt, als Tour geplant) steht als kleines Schild; «Nächstes Mal: …» bleibt in der grauen Zeile.
- Ein Satz unter dem Eingabefeld nennt, wo «Bereit für den Traum?», «Wetterfenster für Träume», «Alle Träume auf einer Karte» und «Erfüllte Träume» zu finden sind.

## Was fällt weg oder rutscht tiefer
- Der lange Einleitungstext: ersetzt durch einen Satz.
- «Dein Jahr» und «Alle Träume auf einer Karte»: nicht mehr sichtbar untereinander, sondern hinter «Jahr» und «Karte».
- «Erfüllte Träume»: die vierte Ansicht «Erfüllt» statt eines offenen Blocks unten.

## Selbst entschieden
- Die Karte «Was du hier tun kannst» bleibt, wie sie ist (sie gibt es seit dem Wegweiser). Ein kurzer Satz unter dem Eingabefeld nennt die vier Funktionen zusätzlich, weil der Test «Funktion sichtbar auf ihrer Seite» ihre Namen sehen will.
- Anmeldefristen bleiben ein Block (er erscheint nur, wenn eine Frist ansteht).
- Die Chips pro Traum zeigen nur den Stand, nicht die neuen Orte (die stehen in der Ansicht «Karte»).
- Tests angepasst: `paketn`, `karte-aller-traeume`, `erfuellte-traeume` klicken zuerst die Ansicht.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Umbau der Seite nach Noahs Antwort «1a 2a 3a 4a 5a».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume öffnen: kurzer Satz, Eingabefeld, «Heute passt».
2. «Karte», «Jahr» und «Erfüllt» antippen: die Ansicht wechselt.
3. «Erfüllt» antippen: die erfüllten Träume erscheinen; «Liste» bringt die Träume zurück.
