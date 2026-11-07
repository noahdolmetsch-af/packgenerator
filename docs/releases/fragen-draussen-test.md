# Test «draussen unterwegs» wartet auf das Wetter

PR # · 07.11.2026 · Auftrag: Koordinator (Thread «Fix roten Test «draussen unterwegs»»)

## Was ist neu
- Nichts in der App. Nur der Test `tests/e2e/fragen-aus-daten.spec.js` («fine weather and a free evening …») war auf `main` rot und hielt PR #1060 auf.
- Ursache: Heute holt beim Öffnen die Wettervorhersage und speichert sie. Der Test schrieb seinen eigenen Wert (21 Grad, trocken) hinein, aber die laufende Abfrage kam danach an und überschrieb ihn mit der Test-Vorhersage (60 % Regen). Dann stellt die Regel «Schönes Wetter» keine Frage. Ob das klappt, hing nur davon ab, wer schneller war; seit #1049 («Wetter im Kopf») war es regelmässig die Abfrage.
- Behebung: Der Test wartet, bis die Vorhersage gespeichert ist, und schreibt erst dann seinen Wert. Das gilt auch für den Test «Grauer Tag», der dieselbe Hilfsfunktion nutzt.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Keine «Was ist neu»-Datei, weil nichts sichtbar ist (Regel: ein PR ohne App-Änderung braucht nur die Release-Datei).
- `docs/app-stand.md` bleibt unverändert, die App kann nichts Neues.
- Kein Eingriff in `src/` und `api/`: die App verhält sich richtig, nur der Test war zu früh.

## Entscheide (für decisions.md)
- nichts

## Stand im Plan (roadmap.md / vorhaben.md)
- nichts

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu sehen. Der Test «fine weather and a free evening ask whether something is planned outside» läuft auf Handy und Computer grün.
