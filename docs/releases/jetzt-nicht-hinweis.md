# Aktionen in Auswerten: «Jetzt nicht» bei den Tipps sagt es und hat «Rückgängig»

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «1-5a» (Prüfung «Aktionen in Auswerten», Entscheid 1a), Teil 2 von 5

Ziele von Noah (23.11.2026 18:09): **Klarheit** (die App sagt, was sie getan hat) und **Auffindbarkeit** (der Tipp ist mit einem Tipp wieder da). Leitfaden `docs/leitfaden.md`: «Eine App, die mich im Alltag unterstützt» (nichts geht still verloren).

## Was ist neu
- «Ideen» › «Für deine Balance»: «Jetzt nicht» unter einem Tipp zeigt den Hinweis ««Schlaf» ruht 7 Tage.» mit «Rückgängig». Rückgängig stellt den vorherigen Stand her, der Tipp steht sofort wieder da.
- Vorher geschah nichts Sichtbares: der Tipp verschwand ohne Wort und ohne Weg zurück.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Brief nennt «Idee ruht 30 Tage». Im Code ruht ein Tipp **7 Tage** (`tipHidden` in `src/lib/ownlists.js`, so steht es auch im Kopf der Seite). Der Hinweis nennt die echte Zeit (7 Tage); die Dauer selbst ist unverändert.
- Der Hinweis nennt den Bereich («Schlaf»), nicht den langen Tipptext.
- Kein Daten-, Backup- oder `api/`-Eingriff; gespeichert wird weiter derselbe Eintrag `ideas.notNow`, Rückgängig schreibt den alten Stand zurück.
- Der Fall «Frage speichern» (Teil 3) und die Heute-Idee «Später» (hat schon einen Hinweis mit Rückgängig) bleiben, wie sie sind.

## Entscheide
- Noah 23.11.2026 19:49 «1-5a», Entscheid 1a. Siehe `docs/decisions/rueckgaengig-acht-sekunden.md` (Nachtrag).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Aktionen in Auswerten»: Teil 2 gebaut; offen: neue Frage mit Hinweis, Löschen-Regel, «Stufen ändern».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Ideen: unter einem Tipp «Jetzt nicht» antippen: Der Hinweis sagt «… ruht 7 Tage.».
2. «Rückgängig» im Hinweis antippen: der Tipp ist wieder da.
