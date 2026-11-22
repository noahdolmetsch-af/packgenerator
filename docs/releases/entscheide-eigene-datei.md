# Entscheide: eine Datei pro PR

PR folgt · 21.11.2026 · Auftrag: Noah «1a 2a» (Zusammenarbeit, vom Koordinator vorgeschlagen). «2a»: jeder PR bekommt für seine Entscheide eine eigene Datei.

## Was ist neu
- Neuer Ordner `docs/decisions/` mit einer Anleitung (`README.md`): ein PR legt seine Entscheide in `docs/decisions/<name>.md` ab, mit dem gleichen Namen wie seine Datei in `docs/releases/`.
- `CLAUDE.md` und `docs/releases/README.md` sagen das jetzt so; `docs/decisions.md` trägt oben einen Hinweis, dass sie nur noch Verlauf ist.

## Was fällt weg oder rutscht tiefer
- Neue Entscheide kommen nicht mehr ans Ende von `docs/decisions.md`. Die Datei und alle alten Einträge bleiben unverändert erhalten.

## Selbst entschieden
- Nur Doku, nichts in der App und kein «Was ist neu»-Eintrag (ein PR ohne sichtbare Änderung bekommt keinen).
- Eine Entscheid-Datei gibt es nur, wenn der PR wirklich etwas entscheidet (Antwort von Noah, Regel, Absage); sonst reicht «Selbst entschieden» in der Release-Datei.
- Die alten Entscheide werden nicht verschoben, damit nichts verloren geht und nichts in anderen offenen PRs kollidiert.

## Entscheide (eigene Datei)
- 21.11.2026: Entscheide je PR in `docs/decisions/<name>.md` (Noah «2a»). Siehe `docs/decisions/entscheide-eigene-datei.md`.

## Prüfschritte (nach dem Merge)
1. Auf GitHub `docs/decisions/README.md` öffnen: die Anleitung steht da.
2. `docs/decisions.md` öffnen: oben steht der Hinweis, dass sie nicht mehr ergänzt wird.
