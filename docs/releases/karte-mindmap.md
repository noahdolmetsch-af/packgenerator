# Die Karte der App als Mindmap

PR #1737 (Neuheit und Doku mit Folge-PR auf eigenen Namen gestellt) · 24./25.11.2026 · Auftrag: Noah «beide» (24.11.), dann «kreislauf fallen lassen» (25.11.) (Thread «Versteckte Inhalte auffindbar machen»)

## Was ist neu
- Ich › Karte der App hat oben zwei Knöpfe: **Liste** (wie bisher, der Baum) und **Mindmap**.
- **Mindmap:** die App links, die Bereiche als Äste; ein Tipp klappt einen Ast zu seinen Reitern auf, ein Reiter zeigt seine Seiten (mit denselben Punkten wie in der Liste: geöffnet, nie geöffnet, neu); immer nur ein Ast offen.
- Gezeichnet von `src/lib/ich/KarteSkizze.svelte`, Daten `src/lib/appskizze.js`, geprüft von `tests/appskizze.test.js` und `tests/e2e/karte-skizze.spec.js`.

## Was fällt weg oder rutscht tiefer
- nichts (die Liste bleibt die erste Ansicht; Suche und Filter der Liste stehen unverändert dort). Der Entwurf «Kreislauf» wurde auf Noahs Wunsch nicht gebaut.

## Selbst entschieden
- Mindmap einseitig auf allen Breiten (der Entwurf am Computer mit zwei Seiten bleibt offen); keine gespeicherte Ansicht.
- Keine Datenänderung, nichts im Backup.
- PR 1737 hatte die Neuheits- und Doku-Dateien von «karte-skizze» (PR 1634) überschrieben; deshalb zählte der Merge nur als Patch und «Was ist neu» zeigte die Mindmap nicht. Jetzt stehen die alten Dateien wieder unter «karte-skizze» und die Mindmap hat ihre eigenen unter «karte-mindmap».

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- `docs/decisions/karte-mindmap.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
