# Neue Ordnung der App: Plan und Wegweiser

PR folgt · 18.11.2026 · Auftrag: Noah «1a 2a 3b 4b 5b» (Thread «Ganze App neu denken: klickbarer Prototyp»)

## Was ist neu
- Nichts in der App. Der PR hält die Entscheide fest: neuer Plan (`docs/plan-ganze-app.md`: Schritte 9 bis 15 neu, 2b, 4b, 6 neu beschrieben, 3s, 3a, 3b, 5a, 5b gestrichen), `docs/wegweiser-neue-ordnung.md` (Orte mit Frage und Reitern, Wegweiser alt → neu, Streichliste mit Noahs Entscheid), Eintrag in `docs/decisions.md` und `docs/vorhaben.md`, ein Satz in `docs/app-stand.md`.
- `tests/plan.test.js` (P1b) erwartet jetzt die sechs gestrichenen Schritte statt nur Schritt 8. Das ist eine Absicht, kein gelockerter Test: Noah hat die Streifen-Schritte am 18.11.2026 gestrichen.

## Was fällt weg oder rutscht tiefer
- nichts (in der App ändert sich nichts). Im Plan: Weg B mit den Schritten 3s, 3a, 3b, 5a, 5b und die Pause für Noahs echte Tour.

## Selbst entschieden
- Neue Schritte bekommen die Nummern 9 bis 15, damit die alten Nummern (2b, 4b, 6, 7a, 7b) und der Test «Schritt 0 bis 8» bleiben. Ich (6), Heute (2b) und die Tourseite (4b) behalten ihre Nummer, weil sie dasselbe meinen.
- Der Prototyp selbst kommt nicht ins Repo: er enthält Zählungen aus Noahs Backup. Im Repo steht nur der Link.
- Keine News-Datei und kein Eintrag in `features.js`: es gibt keine neue Funktion.

## Entscheide (für decisions.md)
- 18.11.2026: Neue Ordnung ersetzt Weg B; Streichliste übernommen; keine Pause; Heute nach «Startseite ruhiger»; ein Thread baut alles (Eintrag steht in `decisions.md`).

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App»: Schritt 9 (Adress-Tabelle) ist der nächste PR. `vorhaben.md` hat einen Absatz «Neue Ordnung der App».

## Prüfschritte (nach dem Merge)
1. Auf GitHub unter Actions: «Build and deploy» auf `main` ist grün.
2. `docs/wegweiser-neue-ordnung.md` auf GitHub öffnen: Tabelle der acht Orte und die Streichliste sind da.
