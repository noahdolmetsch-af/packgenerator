# Das Wetter, das gekommen ist

Auftrag: Noah «a» und «freigabe» im Thread «Wetter besser machen», 22.11.2026; Teil E des Wetter-Ausbaus (A bis D, F bis H stehen in `wetter-ausbau.md`). Noah 23:03 und 23:05: alles freigegeben, freie Hand.

## Was ist neu
- Im Rückblick einer Tour (Mehr › «Wie war es?») steht unter «Wetter» die Zeile «Gekommen: 4–11 °C, 3 mm Regen, Wind bis 28 km/h». Die Zahlen sind das Wetter der Tage der Tour am Startort aus Open-Meteo (kostenlos; die letzten Wochen aus dem Vorhersagedienst, ältere Tage aus dem Archiv), dasselbe, das die Tour-Seite schon zeigt.
- Die Antwort «Wetter» ist vorgeschlagen: Liegt die Mitte des erlebten Bereichs 3 Grad oder mehr unter (über) der Mitte des geplanten, steht «Kälter» («Wärmer»), sonst «Wie geplant». Ein Tipp ändert sie; hast du einmal getippt, ändert die App sie nie mehr (Feld `weatherTouched`). Fertige Rückblicke bleiben, wie sie sind.
- Eine Funktion im Katalog («Wetter, das gekommen ist») mit Anleitung, Beispiel und «Gut zu wissen».

## Was fällt weg oder rutscht tiefer
- nichts. Vorher stand die Antwort immer auf «Wie geplant», bis man etwas tippte; jetzt steht sie auf dem Vorschlag, wenn das Wetter bekannt ist.

## Selbst entschieden
- Der Vorschlag steht nur im Speicher der Seite, bis der Rückblick beim nächsten Tipp ohnehin gespeichert wird; so legt das Öffnen allein keinen Entwurf an.
- Ohne Netz, ohne Ort oder bei noch laufender Tour fragt die App nichts und lässt «Wie geplant».
- Die Grenze von 3 Grad ist eine Schätzung (`FELT_DIFF`, `src/lib/wetter/erlebt.js`); der Wind zählt nicht in den Vorschlag, steht aber in der Zeile.
- Eine eigene Seite für das Archiv-Wetter gibt es nicht: die Daten lagen schon an der Tour (`trip.wxReal`).

## Daten
Der Rückblick bekommt zwei kleine, freiwillige Felder (`weatherAuto`, `weatherTouched`); die Tour bekommt, wo sie noch fehlt, `wxReal` (Feld, das die Tour-Seite schon schreibt). Kein neues Schema, kein neues Backup-Format, kein Sync, kein api/. Ältere Backups ohne die Felder laden wie vorher (der Browser-Test importiert zuerst eine Sicherungskopie).

## Entscheide (eigene Datei `docs/decisions/wetter-erlebt.md`)
- 23.11.2026: das erlebte Wetter schlägt die Antwort vor, ein Tipp von Noah gilt immer (Noah «a», freie Hand).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter ausbauen: mit diesem PR sind A bis H fertig.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Rückblick einer fertigen Tour öffnen, «Wie war es?» aufklappen: die Zeile «Gekommen: …» steht unter «Wetter».
2. Eine andere Antwort tippen und neu laden: die Antwort bleibt.
