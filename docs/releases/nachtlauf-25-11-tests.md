# Nachtlauf 25.11.: veraltete Tests und zwei Wackler wieder grün

PR #NNN · 26.11.2026 · Auftrag: Nachtlauf-Meldung (Issue 1779) sortieren, Tests reparieren (Koordinator, Vorrang)

## Was ist neu
- Nichts Sichtbares geändert, nur Tests (und sechs Hinweistexte alter «Was ist neu»-Zeilen, siehe unten). Der Nachtlauf vom 25.11. lief zum ersten Mal ganz durch und fand Tests, die wegen des Zeitlimits nie drankamen; fast alle waren nach bewussten App-Umbauten veraltet.
- **Seitenleiste am Computer** (PR 1759 «Navigation schlanker» nennt die Unterseite in einer zweiten Zeile, `data-side-sub`): `ausstattung`, `taschen-setups`, `setup-rig`, `velos-material-bereich` und `head` lasen den Reiter samt Unterzeile. Neu: `TAB_LIT` und `TAB_LINK` in `tests/e2e/placetab.js` lesen nur den Reiter, mit und ohne Unterzeile.
- **Fenster-Fuss** (PR 1762 «Nie abgeschnitten»): `daumen.spec.js:59` erwartete am Computer einen nicht festen Fuss; seit der Regel ist er überall fest.
- **Taste «g m»** (Velos und Material): öffnet immer den Reiter Material (`src/lib/nav/keys.js`); `bedienregeln.spec.js:70` prüft jetzt «g v» mit dem zuletzt geöffneten Reiter «Sets».
- **Zwei Wackler:** `design-capture.spec.js` las die Lage des Knopfes «Alles gepackt, los» mitten in der Einblend-Bewegung (jetzt wartet es mit `expect.poll` auf die Ruhelage); `geschafft.spec.js:160` las nach dem Zurücknehmen des Gefühls, bevor der zweite Schreibvorgang gespeichert war (jetzt wartet es auf den Zustand).
- **Sechs «Was ist neu»-Zeilen** (Teile 13, 23, 78, 80, 83 von «Ausprobieren»): ihre Elemente gibt es nur mit Daten oder auf anderen Seiten (Pfadzeile, «Im Fokus», «Warum Fragen?», 12-Wochen-Feld, «n warten auf Rückblick», Start-Filter). Jede Zeile bekommt ein «where» mit Deutsch, wie bei den früheren Fällen (`brotkrumen-doppelt`, `ausw-aufraeumen`, `ausw-aktiv`, `analyse-besser`, `tourkarte-wege`, `vorschlaege-art`). Lokal 4 von 4 Teilen grün.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die «where»-Sätze sind der einzige Text, den man in der App sieht (nur wenn man eine dieser alten Neuheiten-Zeilen antippt und das Element fehlt); die Zeilen selbst bleiben.
- Nicht in diesem PR (an die Besitzer): «Hingebungsvoll» bricht bei 1366 px mitten im Wort (Meditation), Unterzeile «Übersicht»/«Alles» in der Seitenleiste (Navigation will sie streichen), Wege-Wächter `#/inbox/new` und `#/komoot/shared` (noch nicht nachgestellt).

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: Nachtlauf grün für die genannten Tests. In der App nichts zu prüfen.
