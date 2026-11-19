# Training: «Meine Woche» und der Weg zum Wochenplan

PR #<Nummer> · 17.11.2026 · Auftrag: Noah «alle umsetzen 1-10» (Thread «UI-Test der Seite Flow Training», Fund 3)

## Was ist neu
- Die Karte auf Training, in der man die Woche von Hand plant (Plus bei jedem Tag), heisst «Meine Woche» statt «Woche planen». «Woche planen» ist der Ort Planen › Woche, vorher hiessen beide gleich.
- Auf der Karte steht neben «Trainingspläne» der Link «Wochenplan», der zur Seite mit den Stunden pro Woche führt. Training verlinkte bisher nicht dorthin.
- Der Sprung-Chip oben und der Satz im Auswertungs-Feld «Plan erfüllt?» («Oben unter «Meine Woche» planen.») heissen gleich.

## Was fällt weg oder rutscht tiefer
- Der Name «Woche planen» für die Karte auf Training fällt weg (neu: «Meine Woche»). Alte «Was ist neu»-Einträge behalten ihren alten Text.

## Selbst entschieden
- Das bestehende Wort «Wochenplan» aus der Namensliste für den Link (statt «Wochenplan (automatisch)» wie im Entwurf), damit es ein Wort pro Sache bleibt. Neue Zeile 23 in `docs/namen.md`.
- Ob sich die Einheiten von «Meine Woche» und vom «Wochenplan» gegenseitig sehen, ist nicht Teil dieses PRs.
- Reparatur des Tests «Ausprobieren» (er scheiterte auch auf `main`, nicht wegen dieses PRs): Fünfzehn alte «Was ist neu»-Dateien zeigten auf Knöpfe und Teile der Karte «Was du hier tun kannst», die es seit dem Umbau der Hilfe (#1228) auf der Seite nicht mehr gibt (nur noch im Fenster des «?»). Sie zeigen jetzt auf die Hilfe-Zeile, die es noch gibt. Die Zeilen über «Alle Karten wieder einklappen/aufklappen» und das «×» der Karte haben kein Ziel mehr (`go: null`), weil diese Funktionen weg sind. Es ändert nur die Antipp-Ziele alter Neuigkeiten, nichts in der App.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Training: Die Karte mit den Tagen heisst «Meine Woche».
2. «Wochenplan» oben rechts an der Karte tippen: die Seite mit den Stunden pro Woche öffnet sich.
