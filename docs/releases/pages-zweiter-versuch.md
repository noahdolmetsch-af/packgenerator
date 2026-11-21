# Veröffentlichen auf Pages: zweiter Versuch

PR #? · 20.11.2026 · Auftrag: Koordinator (Ursache für den Pages-Fehler finden; Noah gibt die Änderung einzeln frei)

## Was ist neu
- In `.github/workflows/deploy.yml` versucht der Schritt «deploy-pages» bei einem Fehler nach 30 Sekunden ein zweites Mal, mit demselben hochgeladenen Paket.
- Nichts in der App ändert sich.

## Ursache
- Am 20.11.2026 schlugen drei Merges nacheinander (#1299, #1304, #1300) im Schritt «deploy-pages» fehl: «No artifacts named github-pages were found», obwohl der Schritt davor das Paket Sekunden vorher hochgeladen hatte (es lag nachweislich im Lauf). GitHubs Liste der Pakete antwortete eine Sekunde zu spät.
- Ein Neustart desselben Laufs hilft nicht: er lädt ein zweites Paket mit gleichem Namen hoch, und «deploy-pages» bricht mit «Multiple artifacts» ab. Ein frischer Lauf (Run workflow auf main) ging dagegen durch (Lauf 4344), also kein Fehler im Code oder in der Einstellung.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Kein Neustart-Automat und keine neue Datei: nur ein zweiter Versuch im gleichen Job (30 s Pause). Läuft der erste Versuch durch, ändert sich nichts. Die Adresse der Umgebung nimmt die des zweiten Versuchs, sonst die des ersten.
- Der Schritt läuft nur auf main und lässt sich in einem PR nicht ausprobieren; geprüft wird nach dem Merge beim nächsten Online-Gang.
- Keine News-Datei und kein Eintrag in `docs/app-stand.md` (keine Änderung an der App).

## Stand im Plan
- nichts.

## Prüfschritte (nach dem Merge)
1. Beim nächsten Merge: der Lauf «Build and deploy» ist grün; hatte der erste Versuch gefehlt, steht im Lauf «Wait before the second try».
2. Auf der echten Seite stimmt die Version unter Ich › Was ist neu.
