# Ein ruhiges Heute

Auftrag: Noah «bauen alles» (Thread «Klären Ruhige Ansicht»), Schritt 5 von 7

## Was ist neu
- Solange die Ruhige Ansicht läuft, zeigt Heute nur die eine Sache: «Du machst gerade: …», «Öffnen», «Fertig», die Restzeit. Neue Datei `src/lib/ruhig/CalmHome.svelte`, in `App.svelte` um Heute gelegt (Home.svelte bleibt unberührt).
- «Heute trotzdem zeigen» öffnet das normale Heute für diesen Besuch; nichts wird beendet.
- Ist die Zeit um oder tippst du «Fertig», ist Heute wieder wie vorher.

## Was fällt weg oder rutscht tiefer
- Nur während die Ruhige Ansicht an ist: das übliche Heute ist einen Tipp tiefer («Heute trotzdem zeigen»). Sonst nichts.

## Selbst entschieden
- Die gewählte Funktion oder das Suchergebnis aus den Worten gibt «Öffnen» (wie auf den anderen Seiten).
- Home.svelte ist nicht angefasst, damit der Heute-Thread keine Konflikte hat.

## Stand im Plan
- Ruhige Ansicht: Schritt 5 von 7.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ruhige Ansicht starten, Heute öffnen: nur die eine Sache steht da.
2. «Heute trotzdem zeigen» tippen: normales Heute.
