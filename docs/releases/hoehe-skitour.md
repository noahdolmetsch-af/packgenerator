# Temperaturen nach Höhe in «Tour planen»

PR folgt (baut auf PR «Temperaturen nach Höhe auf Heute» auf) · 05.11.2026 · Auftrag: Noah «4b» (Thread «Temperaturen nach Höhe anzeigen»)

Dritter von drei kleinen PRs (Wetterseite, Zeile auf Heute, «Skitour planen»).

## Was ist neu
- Skitouren › Tour planen: unter «Bedingungen» die Karte «Temperaturen nach Höhe»: acht Höhen (4000 bis 500 m) um 6, 9, 12 und 15 Uhr am Tag der Tour, über dem Ort der Tour.
- Zwei neue, freiwillige Felder im Plan: «Höhe des Starts (m)» und «Höhe des Gipfels (m)».
- Mit der Starthöhe: «Luft am Start (1’000 m, 07:00): 12 °C» und ein Knopf «Für «Temperatur am Start» übernehmen». Es wird nichts von selbst ausgefüllt.
- Hinweise (Vorschläge, nie eine Beurteilung des Hangs): die Nullgradgrenze zur geplanten Gipfelzeit; Gipfel sehr kalt (−10 °C oder kälter): warme Schichten, Reservejacke, warme Handschuhe; Gipfel über null: der Schnee kann nass werden, früher Start und frühere Umkehrzeit; Start schon über null: der Schnee ist über Nacht vielleicht nicht gefroren.
- Ohne Ort der Tour steht ein Satz mit dem Knopf «Tour öffnen». Liegt die Tour mehr als zwei Tage nach heute, sagt die Karte, dass die Luftschichten nur bis dahin reichen.

## Was fällt weg oder rutscht tiefer
- nichts. Das Feld «Temperatur am Start (°C)» bleibt von Hand ausfüllbar.

## Selbst entschieden
- Vorausfüllen als Knopf, nicht automatisch (alles ist ein Vorschlag, nichts wird überschrieben). Mit der Startzeit aus «Dein Morgen» («Beginn des Aufstiegs»), sonst 07:00; die Gipfelzeit ebenso («Am Gipfel (geplant)», sonst 11:00).
- Schwellen: −10 °C für «sehr kalt», 0 °C für «über null». Die Hinweise sagen selbst, dass das Lawinenbulletin und der eigene Blick entscheiden.
- Die Luftschichten reichen von heute an drei Tage (`profil.js`); eine spätere Tour zeigt nichts, nur den Satz dazu. Eine Höhe über der obersten Schicht (etwa 4000 m in sehr kalter Luft) zeigt «–».
- Starthöhe und Gipfelhöhe stehen im Plan der Tour (`trip.ski.plan.startM`, `peakM`), also mit im Backup.
- Der Ort ist der Ort der Tour (`trip.place`). Keine neue Funktion in `features.js` (gehört zu «Skitour planen»); `docs/app-stand.md`: die Zeile «Skitour planen» nennt es.
- Open-Meteo ist von hier aus nicht erreichbar: nur mit erfundenen Luftschichten geprüft.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter und Skitouren: Temperaturen nach Höhe (PR 3 von 3), damit ist der Auftrag erfüllt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Skitour in den nächsten drei Tagen mit Ort öffnen: Skitouren › Tour planen: «Temperaturen nach Höhe» mit acht Höhen.
2. «Höhe des Starts» eingeben (z. B. 1500): «Luft am Start» steht da; der Knopf trägt den Wert bei «Temperatur am Start» ein.
3. «Höhe des Gipfels» eingeben (z. B. 2800): unter der Tabelle stehen die Hinweise.
4. Die Seite neu laden: die zwei Höhen sind noch da.
