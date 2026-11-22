# Velo-Zahlen als Wege

PR #… · 07.11.2026 · Auftrag: Noah «alle Vorschläge» der UI-Prüfung, V1 (Thread «Absprünge: Velo-Zahlen als Wege»)

Baut auf den Bausteinen «Zahl mit Weg» und «Quelle-Zeile» auf (PR #1109, `zahl-mit-weg.md`).

## Was ist neu
- Bei Velos führen die Zahlen jetzt irgendwohin (kleiner Pfeil, 44 px Tippfläche, Zeile bleibt gleich hoch):
  - **Kilometer** (Kopf des Velos und Velo-Karte) → Analyse, Teil «Velos». Dafür versteht die Analyse neu `?tab=velos` im Link (`velosHref`, `tabOfHash` in `src/lib/analyse/jump.js`).
  - **Kosten** («CHF 186 dieses Jahr · CHF 69 pro 1000 km») → Jahresbilanz dieses Velos.
  - **«Nichts fällig» / «n fällig»** auf der Velo-Karte → Pflege dieses Velos.
  - **«Nächste Tour: …»** unter dem Titel → Packliste dieser Tour (war nur ein Satz).
- Der Baustein `NumLink` kennt neu `to`: ein Ziel in der App, das kein Analyse-Wert ist (`numHref({ to })`).
- Test `tests/velo-zahlen.test.js`, Seitentest `tests/e2e/velo-zahlen.spec.js`, Deutsch in `src/lib/i18n/de/velo-zahlen.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Texte und Reihenfolge bleiben gleich; es kommen nur Wege dazu.

## Selbst entschieden
- Nur Zahlen in `Bikes.svelte` (Velo-Kopf und Velo-Karten), wie vom Koordinator verlangt. Die Struktur von Velos (Ort-Vorlage) baut der Skizzieren-Thread, die Pflege in Gruppen das Vereinfachen; Teile-Schlüssel in `anpassen/parts.js` bleiben unberührt.
- «5 Punkte ohne Daten» und «Verschleiss → Einkaufsliste» aus dem Entwurf V1 folgen nicht hier: sie hängen an der Pflege-Umgestaltung.
- Keine neue Funktion in `features.js` (nur Wege auf bestehenden Seiten), darum keine Fertig-Regel-Zeilen; Zeile in `docs/app-stand.md` unverändert.
- Kilometer führen zum Teil «Velos» der Analyse für alle Velos (nicht gefiltert auf ein Velo): die Analyse hat dort noch keinen Velo-Filter.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: V1 (Velo-Zahlen) gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos öffnen, auf die Kilometer eines Velos tippen: die Analyse öffnet bei «Velos».
2. Zurück, auf einer Velo-Karte «nichts fällig» (oder «n fällig») antippen: die Pflege dieses Velos öffnet sich.
3. Zurück, unter dem Titel «nächste Tour: …» antippen: die Packliste dieser Tour öffnet sich.
4. Unter dem Namen des Velos die Kosten antippen (nur sichtbar, wenn Werkstattbesuche erfasst sind): die Jahresbilanz öffnet sich.
