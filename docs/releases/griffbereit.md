# Griffbereit: Essen und Regenzeug nicht ganz unten

PR (G3) · 23.11.2026 · Auftrag: Noah «G1 G2 G3» (Thread «Packen leichter und besser machen»); Noah wählte «Du markierst, App schlägt vor»

## Was ist neu
- Bei einer geplanten Tour mit Velo hat die Karte «Bereit zur Abfahrt?» eine Zeile **«Griffbereit: Riegel liegt tief in einer Tasche»**, wenn Essen, Regenzeug oder ein von dir markiertes Teil in einer Tasche liegt, die man beim Fahren nicht erreicht (Satteltasche, Seitentaschen, Rahmentasche, Gabel, Lenkerrolle).
- Ein Tipp öffnet ein Fenster: «In Oberrohrtasche legen» (mit «Rückgängig», wie jede Änderung der Liste) oder «Diesmal nicht» (nur für diese Tour).
- Im Fenster eines Teils steht unter «Wo es hinkommt» die Zeile **«Griffbereit»**: *Automatisch* (Essen und Regenzeug), *Griffbereit* (du markierst es) oder *Nie einen Platz vorschlagen*.
- Code: `src/lib/pack/griff.js` (Regeln), `griffeld.js` (Feld `reach`), `GriffSheet.svelte` (Fenster), Zeile in `src/lib/trip/ampel.js`; Tests `tests/griffbereit.test.js`, `tests/e2e/griffbereit.spec.js`.

## Was fällt weg oder rutscht tiefer
- Nichts. Die Zeile steht nur in der bestehenden Karte und nur, wenn etwas tief liegt; über der Packliste kommt nichts Neues dazu (Content first).

## Selbst entschieden
- **Erreichbar** heisst: Oberrohrtasche, Minitasche, Beutel links oder rechts (in dieser Reihenfolge), dazu alles am Körper, an der Hüfte, am Velo montiert oder in einem Flaschenhalter. Eine Tasche gilt nur, wenn die Tour sie wirklich hat; es wird nie eine Tasche hinzugefügt.
- Passt es? Sind die Liter von Teil und Tasche bekannt und das Teil ist grösser, wird die Tasche übersprungen; sonst gilt es als möglich (die App rät nicht).
- Automatisch gilt nur für die Kategorien «Essen und Trinken» und «Regen und Kälte»; alles andere wird nur vorgeschlagen, wenn du es markierst. «Nie einen Platz vorschlagen» gewinnt immer.
- Höchstens 6 Zeilen; Teile, die du nicht besitzt (Wunschliste), und Touren ohne Velo (eigene Packstücke) werden nicht geprüft.
- Die Marken aus G2 («Abendblick») fliessen noch nicht ein: «oft unterwegs gebraucht» lernt die App erst, wenn genug Rückblicke da sind; das wäre ein eigener, späterer Schritt.
- Keine eigene Funktionsseite (wie «Dazu nötig»).
- Dieser PR bringt auch den Testfix für `tests/e2e/v0540.spec.js`: das Fenster eines Teils hat seit «Dazu nötig» die Zeile `with` nach den Bausteinen, der Test kannte die Reihenfolge noch ohne sie (auf main rot, Nur Testcode).

## Daten
- Neues optionales Feld `reach` am Teil (wahr/falsch, sonst fehlt es), keine Änderung an Schema, Backup-Format oder Abgleich; die Liste der Tour bekommt bei «Diesmal nicht» `griffSkip` (Liste von Teil-Nummern). Öffnen und Speichern eines Teils lässt das Feld weg, wenn es nie gesetzt war (Test).

## Stand im Plan
- Packen leichter und besser: G1 «Dazu nötig» online, G2 «Abendblick» (PR 1583), G3 «Griffbereit» gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In Material eine Regenjacke öffnen: unter «Wo es hinkommt» steht «Griffbereit: Automatisch».
2. In Packen eine geplante Tour mit einem Riegel in der Satteltasche öffnen, Karte «Bereit zur Abfahrt?» aufklappen: die Zeile «Griffbereit» steht da.
3. Tippen, «In Oberrohrtasche legen»: der Riegel liegt dort; «Rückgängig» legt ihn zurück.
