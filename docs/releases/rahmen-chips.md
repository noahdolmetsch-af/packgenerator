# Rahmen: Chips in einer Zeile

PR (offen) · 24.11.2026 · Auftrag: Noah «1-5a» (impeccable-Prüfung der ganzen App, Paket 1)

## Was ist neu
- Am Handy stehen die Chips unter den Reitern (Woche, Training, Notizen, Alltag, Pflege, Material, Auswerten …) in **einer Zeile**, die man seitwärts wischt. Die Ränder blenden weich aus; der gewählte Chip scrollt ins Bild.
- Bei Training steht «Heute abhaken» als **erster Chip**. Der Reiter «Training» öffnet wie bisher die Trainingsseite.

## Was fällt weg oder rutscht tiefer
- Die Punkte-Zeile (• • • •) unter den Reitern ist weg; der Strich unter dem Reiter zeigt, wo man ist, und Wischen geht weiter.
- Chips, die nicht in die Zeile passen, stehen rechts und sind mit Wischen erreichbar (früher eine zweite oder dritte Zeile). Keine Adresse ändert sich.
- Am Computer bleibt alles, wie es war.

## Beitrag zu den Hauptzielen
- **Klarheit:** die Hauptsache der Seite beginnt 50 bis 150 px höher, ein Kopf-Stapel weniger.
- **Auffindbarkeit:** «Heute abhaken» steht bei Training vorn.
- **Leitfaden:** ruhiger Alltag, ein Aussehen auf allen Seiten.

## Selbst entschieden
- Der Reiter «Training» landet weiter auf der Trainingsseite, nur die Chip-Reihenfolge ändert sich (`home` in `tabWithSubs`, `src/lib/nav.js`).
- Die Chip-Reihe gilt für alle Seiten mit Chips (eine Stelle: `PlaceTabs.svelte`).

## Entscheide
- `docs/decisions/rahmen-chips.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
