# Wetter-Neuigkeiten: wo man hinschaut

Auftrag: Bündler 23.11.2026, main war rot nach PR 1504 (Wetterseite aufräumen): `tests/e2e/ausprobieren.spec.js` «What is new goes to its exact place».

## Was ist neu
- Drei Zeilen der Neuigkeit «Wetterseite aufgeräumt» (Kurzantwort ×2, «Die nächsten Stunden») leuchteten nichts an, wenn der Wetterdienst noch nicht geantwortet hat (Kurzantwort und «Die nächsten Stunden» erscheinen erst mit der Vorhersage). Sie haben jetzt eine Zeile «wo»: sie erscheint, wenn die Stelle fehlt. Die Seite selbst ist unverändert.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Test bleibt, wie er ist (nichts gelockert): die Neuigkeits-Zeilen wurden an die Seite angepasst, nach dem Muster «Schritte plus wo» aus `src/lib/news/README.md`.
- Keine Daten, kein Schema, kein Backup, kein Sync, kein `api/`.

## Prüfschritte (nach dem Merge)
1. Ich › Neuigkeiten, eine Zeile zur Wetterseite antippen: Wetter öffnet sich, die Stelle leuchtet oder der Hinweis sagt, wo sie erscheint.
