# Zurück am Eingang

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «ja» (Thread «Navigation ohne Sackgassen», «Zurück führt nie aus der App hinaus»)

## Was ist neu
- Wer die App mit einer Adresse tief in der App öffnet (Lesezeichen, Link aus einer Nachricht, geteilte Tour), hat vor der Seite sonst nur die Seite davor, oft eine andere App. Beim ersten Tipp auf die Seite legt die App jetzt einmal Heute darunter (`src/lib/nav/eingang.js`, ein Aufruf in `src/App.svelte`): Zurück führt auf Heute.
- Einmal pro Tab (`sessionStorage`), ein Neuladen legt kein zweites Heute darunter. Wer auf Heute öffnet, sieht keine Änderung.
- Prüfung: `tests/e2e/eingang.spec.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Zurück von Heute selbst verlässt die App wie bei jeder App (keine Falle).

## Selbst entschieden
- Heute wird mit `replaceState` an die Stelle des ersten Eintrags gesetzt und die Seite mit `pushState` darüber gelegt; die Zurück-Taste bleibt die des Browsers.
- Erst beim ersten Tipp, nicht beim Start: Chrome überspringt Verlaufseinträge, die eine Seite ohne Tipp anlegt, beim Zurück (Schutz vor Verlauf-Missbrauch). Ein beim Start angelegter Eintrag brach das Schliessen von Fenstern (der Test `termine.spec.js` wurde rot, so gefunden). Wer nach dem Öffnen sofort Zurück drückt, ohne die Seite anzutippen, geht dorthin zurück, woher er kam.

## Entscheide
- Keine eigene Datei: Fortsetzung von `docs/decisions/wege-waechter.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Navigation ohne Sackgassen: «Zurück am Eingang» erledigt. Folgt: gleiche Namen überall, Abschnitte in der Suche.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Seite der App über ein Lesezeichen oder einen Link öffnen, nicht über Heute (zum Beispiel Ich › Gewicht).
2. Auf Zurück tippen: du bist auf Heute, nicht ausserhalb der App.
