# Assistent unter Ich: «Frag Gemini» wieder höchstens drei Taps von Heute

25.11.2026 · Auftrag: Reparatur vom Bündler (Test `tests/e2e/tippzahl.spec.js` rot auf main seit «Frag Gemini», Thread «Frag Gemini»)

## Was ist neu
- Auf der Seite Ich steht in der Gruppe «Hilfe» eine neue Zeile «Assistent» (über «Hilfe und Funktionen»). Sie öffnet `#/assistent`; der dritte Reiter «Frag Gemini» ist dort einen Tap weiter.
- Grund: Seit «Ein Eingang (Stufe 2)» zeigt die Suche den Assistenten nur noch unter einer Frage. Der kurze Weg Heute > Suche > Assistent > Reiter ist damit weg, «Frag Gemini» war vier Taps von Heute entfernt (Test «jede Funktion höchstens 3 Taps»). Jetzt: Heute > Ich > Assistent > «Frag Gemini» = 3 Taps.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Eine Zeile in einer bestehenden Liste statt einer neuen Karte: «Inhalt zuerst» bleibt gewahrt, der Test wurde nicht gelockert.
- Kein neuer Text: die Zeile nimmt den Namen «Assistent» und die Unterzeile aus der Kopfzeile der Assistenten-Seite.

## Entscheide
- `docs/decisions/assistent-unter-ich.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Unten in der Leiste «Ich» tippen: in der Gruppe «Hilfe» steht die Zeile «Assistent».
2. Zeile antippen und den dritten Reiter «Frag Gemini» öffnen.
