# Zahl mit Weg und Quelle-Zeile (Baustein)

PR #… · 07.11.2026 · Auftrag: Noah «alle Vorschläge» der UI-Prüfung, Rang 1; Fragen «2b» (jede Zahl antippbar) und «5b» (Wetter zur Tour jetzt bauen) (Thread «Absprünge in der ganzen App umsetzen»)

Dieser PR ändert nichts, was man in der App sieht. Er legt nur die zwei Bausteine bereit, die die späteren PRs (Aktiv, Auswerten, Analyse, Velos, Woche, Tourkarte) verwenden. Keine Seite benutzt sie schon.

## Was ist neu
- `src/lib/analyse/weg.js` (rein, getestet): `numHref({ key, range, day, src })` sagt, wohin ein Tipp auf eine Zahl führt: die Seite des Werts in der Analyse (mit Zeitraum), das Blatt eines Tages, oder, ohne Analyse (Noah «2b»), die Seite der Quelle. `sourceLink(src)` nennt zu Fitbit, Strava, «Wi gaht's?» und Aktiv die Seite der App.
- `src/lib/ui/NumLink.svelte`: eine Zahl mit kleinem Pfeil und 44 px Tippfläche; ohne Ziel bleibt sie ein einfacher Text.
- `src/lib/ui/SourceLine.svelte`: die Zeile «Quelle: Fitbit ›».
- Deutsche Texte in `src/lib/i18n/de/zahl-mit-weg.js`, Test `tests/weg.test.js`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Keine «Was ist neu»-Datei und keine Funktion in `features.js`, weil noch nichts Sichtbares entsteht (Regel 12: ein PR ohne Änderung bekommt nur diese Datei).
- Eine eigene Eigenrechnung («body») hat keine Quellseite: die Zeile zeigt dann nichts, die Seite behält ihren Satz.
- Strava führt zu «Ich › Verbindungen» (dort stehen Stand und Fehler), Fitbit zur Fitbit-Seite.

## Entscheide (für decisions.md)
- 07.11.2026: Jede Zahl darf ein Weg sein; ohne Analyse führt sie zur Quelle (Noah «2b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: Rang 1 (Baustein) gebaut; Rang 2 bis 11 und die neun Hinweise folgen als einzelne PRs.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts Sichtbares: die App sieht aus wie vorher. Ich › Was ist neu zeigt keinen neuen Eintrag.
