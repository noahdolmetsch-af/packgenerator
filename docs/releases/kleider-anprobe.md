# Anprobe

PR #1783 · 22.11.2026 · Auftrag: Noah «1-5a 4b» (Thread «Kleiderschrank wieder ins Zentrum rücken», Weg A)

## Was ist neu
- Neue Seite «Anprobe» (`#/wardrobe/tryon`, unter Kleider): eine Temperatur wählen (heute am Wohnort, die nächste Tour oder eine eigene, mit Regler und «Regen unterwegs») und sehen, welches Teil des Kleiderschranks die Zwiebel für jede Stelle nimmt. Dazu das Gewicht und die Lücken (mit dem Grund, wie bei «Was ziehe ich heute an?»).
- Pfeile bei jedem Teil tauschen es gegen das nächste Teil derselben Stelle (dieselbe Rangfolge wie im Heute-Fenster).
- «Für <Tour> einpacken» legt die gezeigten Teile (ohne die, die schon auf der Liste stehen) als «am Körper» auf die Packliste der nächsten Tour, mit «Rückgängig».
- Weg dahin: «Passt hier» am Ende des Kleiderschranks und die Kachel «Anprobe» in «Alles hier» unter Material.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Seite speichert von sich aus nichts (kein Schema, kein Backup, kein Sync, kein api/); nur «Für die Tour einpacken» schreibt auf die Packliste, mit «Rückgängig».
- Die Rechnung ist keine neue: `onionRows` (Zwiebel), `swapOptions` und `gapReason` (Heute-Fenster), mit dem gelernten Wert («du frierst») und deiner eigenen Regel.
- Das Mockup hatte noch eine Figur und «Als Outfit speichern»: beides kommt später, wenn es gebraucht wird («Als Kit speichern» gibt es im Kleiderschrank bereits).
- Die Teile werden «am Körper» eingepackt; in eine Tasche verschiebt man sie in der Packliste (Tauschen › «Andere Tasche»).
- Kein Absprung von Heute (Heute bleibt unverändert, Noah 22.11.).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Velos und Material» → «Kleider», ganz nach unten, unter «Passt hier» «Anprobe» tippen.
2. Temperatur ändern (Knöpfe oder Regler): die Teile pro Stelle wechseln; bei Kälte ohne passendes Teil steht eine Lücke mit Grund.
3. Pfeil neben einem Teil tippen: das nächste Teil der Stelle erscheint.
4. «Für <Tour> einpacken» tippen: die Teile stehen auf der Packliste; «Rückgängig» nimmt sie wieder ab.
