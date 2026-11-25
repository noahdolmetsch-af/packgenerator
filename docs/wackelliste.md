# Wackelliste

Ein Wackler ist ein Test, der ohne Änderung an der App mal grün und mal rot ist, oder der auf main rot wird, ohne dass eine App-Änderung dazu passt. Der Ablauf steht in `docs/regeln.md`, Block 7 («Wackel-Wächter»). Diese Liste führt der Thread «Wackel-Tests zuverlässig machen»; nur Testnamen und Ursachen, keine Daten.

**Stand:** `offen` = gemeldet, noch nicht stabil (Fix-PR hat beim Bündler Vorrang); `beobachten` = einmal gesehen, Ursache unklar; `stabil` = Ursache behoben, 3× pro Gerät grün.

| Test (Datei:Zeile) | Gerät | Gesehen | Ursache | Fix | Stand |
|---|---|---|---|---|---|
| tote-knoepfe.spec.js:28 | Handy | 24.11. | Netz aus, bevor die nachgeladene Seite «Hinweise» da war | #1731 | stabil |
| rueckblick-design.spec.js (Knöpfe 44 px) | Computer | 24.11. | kleine Knöpfe (`.btn.sm`) sind mit Maus 32 px, 44 nur bei Touch | #1727 | stabil |
| wochenrueckblick-mehr.spec.js (Notiz/Ziel) | beide | 24.11. | Neuladen vor dem fertigen Speichern | #1727 | stabil |
| bedienung.spec.js:31 | Computer | 24.11. | «n» kam, bevor das geschlossene Fenster seinen Verlaufsschritt abgegeben hatte | #1713 | stabil |
| landscape (Tour quer, 844×390) | Handy | 24.11. | echter App-Fehler: leere Zeile im Tour-Band, 16 px zu breit | #1712 | stabil |
| erinnerung.spec.js:29 | Handy | 25.11. | Seitenwechsel, solange das geschlossene Fenster seinen Verlaufsschritt zurücknimmt (`ERR_ABORTED`) | #1743 | stabil |
| kursblick.spec.js:50 | Handy/Computer | 25.11. (PR 1752) | Händlerabschlag: die Seite speichert 5 und dann 4 im Hintergrund; das Neuladen schnitt die 4 ab, es kam 5 zurück | #1754 | stabil |
| dateneingabe.spec.js:69 | beide | 25.11. | das Warten las `.fit.pressureF` vor dem ersten Speichern (`TypeError`) | #1743 | stabil |
| «Ausprobieren»: fünf Zeilen (Auswerten Zeitraum, Touren-Vorschläge Kanton, Schwierigkeit, Wochenwetter) | beide | 25.11. | keine Wackler: durch Umbauten veraltete Ziele, nie in PR-Läufen getippt | #1743 | stabil |
| guard.spec.js Gruppe 3 («0 page titles») | Handy | 24.11. | unter Last wird die Überschrift zweimal gleich «0» gemessen | – | beobachten |
| tages-check.spec.js:349 (Sonntagsfrage) | Computer | 25.11. (PR 1755) | `page.reload` ERR_ABORTED: «Speichern» schliesst das Fenster der Runde, das gibt seinen Verlaufsschritt eine Aufgabe später zurück; das Neuladen fiel dazwischen (1 von 24 Läufen unter Last nachgestellt) | geteilter Baustein clock.js wartet vor goto und Neuladen auf den Verlaufsschritt (#1758) | stabil |
| touren-a2.spec.js:60 (Plan: Sportart pro Tag) | Handy | 25.11. (PR 1752, 1733) | `locator.tap` 90 s bei «Hinzufügen» (Unklare Stellen). Nicht nachgestellt; nachgestellt mit 6-fach gebremster CPU wurde ein anderer Fehler derselben Datei: zwei schnelle Taps auf «Velo» und «Wandern» speichern je die ganze Liste aus dem alten Stand, der erste Tap ging verloren (10 von 16 rot) | Test wartet nach dem ersten Tap, bis die Seite ihn zeigt (#1758); 16 von 16 grün, auch 12-fach gebremst | beobachten |
| karte-skizze.spec.js:9, gt20-touren.spec.js:68, kleideranpassen.spec.js:219 | Handy | 25.11. (PR 1752) | rot unter CI-Last; lokal 14 von 14 grün, keine Fehlerzeile bekommen | – | beobachten |
| au.spec.js:47, termine.spec.js:395 und :315, daumen.spec.js:112 | Handy | 25.11. (PR 1752, 1733) | gemeldet: nach dem Schliessen eines Fensters bleibt nach `goto` die alte Seite stehen; Ursache vermutet wie bei tages-check:349 (Verlaufsschritt des geschlossenen Fensters), nicht einzeln nachgestellt | geteilter Baustein `clock.js` wartet vor `goto` und Neuladen auf den Verlaufsschritt (#1758) | beobachten |
| suche-zuletzt-seiten.spec.js:28 | Handy | 25.11. (PR 1752, 1733) | zwei Ursachen, mit 6-fach gebremster CPU nachgestellt (3 von 24 rot): (1) die Daten-Seite des Imports (`#/me/data`) wird gezählt, wenn sie kurz offen bleibt, und steht als dritte Zeile in der Liste (der Test erwartete genau 2); (2) die App zählt eine Seite erst nach 900 ms und schreibt die Liste dann (lesen, ändern, schreiben): kam das nach «Liste vergessen» und «Rückgängig», überschrieb es «Rückgängig» | Test prüft die ersten zwei Zeilen und dass die aktuelle Seite fehlt; wartet vor «Vergessen», bis die Seite gezählt ist (#1758); 32 von 32 grün bei 6-fach gebremster CPU | stabil |
| wunschanfrage.spec.js:139 | Handy | 25.11. (PR 1752) | `page.goto` /buchen/ ERR_ABORTED; vermutet wie bei tages-check:349 | geteilter Baustein `clock.js` (#1758) | beobachten |
| warumregeln.spec.js:50 | Handy | 25.11. (PR 1752) | 90 s Timeout, keine Fehlerzeile bekommen, lokal grün | – | beobachten |
| neuland.spec.js, inspiration.spec.js | beide | Nacht 24.11. | Meldung deckt Taste zu; Seitenleiste «Touren» mit Zusatztext | #1698 | stabil |
| checks, erinnerungen, ich-vier-gruppen, nacht-push, nebel-push, paketn, push, seitengroesse (je .spec.js) | beide | Nacht 24.11. | neu rot im Nachtlauf 24.11. (13:06 UTC); Ursache je Test noch nicht einzeln bestätigt | – | beobachten |
| e2e-part (1), Handy und Computer: «Zeitlimit», ohne Testliste | beide | Nacht 22.–24.11. | der Teil läuft ins Zeitlimit und stürzt ab, bevor die Liste der roten Tests geschrieben wird; «wieder grün» ist damit unbekannt | – | offen |
| ride-running 320 px, gt20-touren:67, uebergaenge:138, pf Szenario 3, pinmarks:52 | – | 24.11. | unklar, je einmal gesehen | – | beobachten |

Ältere, behobene Fälle (rund 30 seit 23.11.2026) mit Ursache: Notiz des Wackel-Threads im Projektordner (`notes/wackel-tests/`).
