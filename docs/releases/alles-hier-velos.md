# Alles hier bei Velos und Material

PR #? · 03.11.2026 · Auftrag: Noah «1a» und «freigabe» (Thread «Bringe versteckte Funktionen online»)

## Was ist neu
- Oben auf **Velos und Material** (unter dem Einstieg) das Feld **«Alles hier»**: 20 Velo-Funktionen als Kacheln, ein Tipp bis zur Seite. Verschleiss, Prüfen, Werkstatt, Spickzettel, Ersatzteile, Verschleiss-Fotos, Winter und Frühling, Jahresrückblick, Verkaufsinserat, Velo verpacken, Strava, km-Import, Setup, Taschenplan, Setup-Logbuch, Ausrüstung, Vergleich, Masse und mehr.
- **«Ändern»**: Kacheln mit Pfeilen oder dem Griff verschieben, ausblenden (mit Rückgängig), wieder zeigen, «Wie am Anfang».
- Baustein für alle Bereiche: `src/lib/alleshier.js` (Liste `ALL_HERE`, Namen und Seiten aus `features.js`) und `src/lib/ui/AllHere.svelte`. Die nächsten PRs fügen nur ihre Liste hinzu.

## Was fällt weg oder rutscht tiefer
- Nichts fällt weg. Die Velo-Karten, Setup und die Kacheln am Seitenende rutschen um das Feld nach unten (Handy etwa einen halben Bildschirm). Wer das Feld nicht braucht, blendet die Kacheln unter «Ändern» aus.

## Selbst entschieden
- Die Liste nimmt nur Funktionen mit fester Seite aus `features.js`; Titel und Link kommen von dort, damit nichts doppelt gepflegt wird.
- Die Reihenfolge und Ausgeblendetes liegen in den Einstellungen (`alleshier.bikes`), also auch im Backup.
- Fertig-Regel: «Alles hier» ist ein Weg zu bestehenden Funktionen, keine neue Funktion; darum kein Eintrag in `features.js`, kein «Gut zu wissen» und kein «Als Nächstes». Leerer Zustand: sind alle Kacheln ausgeblendet, sagt das Feld, wie sie zurückkommen.

## Stand im Plan
- Versteckte Funktionen: Schritt 3 von 9. Danach Material, Aktiv, Auswerten, Touren, Planen, Ich.

## Prüfschritte
1. Öffne Velos und Material: Oben steht «Alles hier» mit Kacheln. Tippe «Verschleiss»: die Seite öffnet sich.
2. Tippe «Ändern», schiebe eine Kachel nach oben, blende eine aus und tippe «Rückgängig».
