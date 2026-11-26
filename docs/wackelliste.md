# Wackelliste

Ein Wackler ist ein Test, der ohne Änderung an der App mal grün und mal rot ist, oder der auf main rot wird, ohne dass eine App-Änderung dazu passt. Der Ablauf steht in `docs/regeln.md`, Block 7 («Wackel-Wächter»). Diese Liste führt der Thread «Wackel-Tests zuverlässig machen»; nur Testnamen und Ursachen, keine Daten.

**Stand:** `offen` = gemeldet, noch nicht stabil (Fix-PR hat beim Bündler Vorrang); `beobachten` = einmal gesehen, Ursache unklar; `stabil` = Ursache behoben, 3× pro Gerät grün.

| Test (Datei:Zeile) | Gerät | Gesehen | Ursache | Fix | Stand |
|---|---|---|---|---|---|
| pack-schritte.spec.js:7 (Schritte, gemerkte Reihenfolge) | Handy | 25.11. (PR 1776) | Neuladen, bevor die mit dem Pfeil verschobene Reihenfolge in den Einstellungen gespeichert war (`pack.steps.order`); das Warten fehlte, bei den Einstellungen weiter unten im Test war es da | #1776 | beobachten |
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
| pf.spec.js:940 (PF16, Backup-Rundlauf) | Computer | 25.11. (PR 1760, main 9bf587c) | Heute legt `home.spruch` (gezeigter Spruch) und `flow.medSeed` (Meditations-Vorlagen) erst an, wenn die Kachel gezeigt wird; das fiel mal vor, mal nach den Snapshot, die Einstellungen kamen mit einem Eintrag mehr zurück (2 von 12 rot, kein App-Fehler) | #1766 | stabil |
| seitengroesse.spec.js | beide | 25.11. (Wi gaht's, PR 1777) | kein Wackler, eine echte Überschreitung: `#/trips` baut 1680 statt 1620 Elemente, `#/gear?tab=wishlist` 1542 statt 1540; die Zahl ist auf jedem Rechner gleich. Auf main seit Velos-Umbau 24.11. (PR 1702: 1622) und weiter gewachsen (1668, 1676, 1680); die CI auf main läuft nur `build`, das Rot fällt nur in PRs auf | #1782 | stabil |
| neuland.spec.js, inspiration.spec.js | beide | Nacht 24.11. | Meldung deckt Taste zu; Seitenleiste «Touren» mit Zusatztext | #1698 | stabil |
| checks, erinnerungen, ich-vier-gruppen, nacht-push, nebel-push, paketn, push, seitengroesse (je .spec.js) | beide | Nacht 24.11. | neu rot im Nachtlauf 24.11. (13:06 UTC); Ursache je Test noch nicht einzeln bestätigt | – | beobachten |
| e2e-part (1), Handy und Computer: «Zeitlimit», ohne Testliste | beide | Nacht 22.–24.11. | der Teil läuft ins Zeitlimit und stürzt ab, bevor die Liste der roten Tests geschrieben wird; «wieder grün» ist damit unbekannt | – | offen |
| ride-running 320 px, gt20-touren:67, uebergaenge:138, pf Szenario 3, pinmarks:52 | – | 24.11. | unklar, je einmal gesehen | – | beobachten |

Ältere, behobene Fälle (rund 30 seit 23.11.2026) mit Ursache: Notiz des Wackel-Threads im Projektordner (`notes/wackel-tests/`).
| sonnen-ausfahrt.spec.js:145 | Handy | 25.11. (PR 1782, volle Prüfung) | kein Wackler: seit PR 1769 öffnet sich das Morgenfenster nicht mehr von selbst, der Test wartete darauf (3 von 3 rot, lokal Bisect 1766 grün / 1769 rot) | #1782 | stabil |
| ski.spec.js:121 | Handy | 25.11. (PR 1782, volle Prüfung) | las `[data-group]` gleich nach der Überschrift, die Gruppen waren noch nicht gebaut (leere Liste, im Retry grün) | #1782 | stabil |
| sn5plus.spec.js:186 | Handy | 25.11. (PR 1782, volle Prüfung) | «Übernehmen» gibt es auch bei den Namensvorschlägen (Ich › Daten), beim Seitenwechsel noch im Bild: 10 Treffer statt 1 (strict mode, im Retry grün) | #1782 | stabil |
| tp-freier-tag.spec.js:36 | beide | 26.11. (PR 1782, volle Prüfung) | kein Wackler: seit PR 1783 steht der Hinweis im zugeklappten «Mehr dazu», der Test suchte die alte Zeile (3 von 3 rot, auch lokal auf main) | #1782 | stabil |
| ausstattung.spec.js:44 / taschen-setups.spec.js:56 / setup-rig.spec.js:65 / velos-material-bereich.spec.js:10 / head.spec.js:27 | Computer | 25.11. (Nachtlauf 1779) | kein Wackler: seit PR 1759 steht die Unterseite als zweite Zeile unter dem Reiter in der Seitenleiste, die Tests lasen Reiter und Zeile zusammen | #NNN | stabil |
| daumen.spec.js:59 | Computer | 25.11. (Nachtlauf 1779) | kein Wackler: seit PR 1762 ist der Fenster-Fuss überall fest, der Test erwartete am Computer das Gegenteil | #NNN | stabil |
| bedienregeln.spec.js:70 | Computer | 25.11. (Nachtlauf 1779) | kein Wackler: «g m» öffnet seit Velos und Material immer Material, der Test erwartete den zuletzt geöffneten Reiter | #NNN | stabil |
| design-capture.spec.js:6 | Computer | 25.11. (Nachtlauf 1779) | Knopf «Alles gepackt, los» mitten in der Einblend-Bewegung gemessen (4051 statt unter 1058), im Retry grün | #NNN | stabil |
| geschafft.spec.js:160 | beide | 25.11. (Nachtlauf 1779) | Gefühl zurücknehmen und neue Dauer sind zwei Schreibvorgänge, der Test las nach dem ersten | #NNN | stabil |
| ausprobieren.spec.js Teile 13/23/78/80/83 | beide | 25.11. (Nachtlauf 1779) | kein Wackler: sechs alte Neuheiten-Zeilen ohne «where», ihre Elemente gibt es nur mit Daten oder anderswo | #NNN | stabil |
