# Schrift: drei schnelle Knöpfe

PR folgt · 03.11.2026 · Auftrag: Noah «Drei Knöpfe dazu» (Thread «Finden: Was wir übersehen haben», Schritt 6)

## Was ist neu
- Ich › Darstellung, bei der Textgrösse: drei Knöpfe «Klein» (90 %), «Normal» (100 %) und «Gross» (115 %). Ein Tipp stellt die Schrift sofort ein. Der Regler 80–130 % bleibt für alles dazwischen (`SIZE_PRESETS` in `src/lib/theme.svelte.js`).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Knopf zeigt sich als gewählt, wenn der Regler genau auf seinem Wert steht; bei einem Wert dazwischen ist keiner gewählt.
- Keine neue Funktion in `features.js`: Es ist eine Ergänzung der bestehenden Textgrösse (kein eigener Eintrag, kein «Passt hier»).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Lücken-Vorschläge 02.11.: Schritt 6 (Schriftgrösse) gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Darstellung öffnen, zur Textgrösse scrollen.
2. «Gross» tippen: die ganze App wird sofort grösser.
3. «Normal» tippen: alles ist wieder wie vorher.
