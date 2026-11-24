# Heute auf leerem Gerät: «Heute fällig» und Fitbit-Zeile bleiben sichtbar

Auftrag: Rote Tests auf main nach «Starte hier» (#1633), Hinweis vom Bündler; Regel 11 «Was heute fällig ist, versteckt sich nie»

## Was ist neu
- Auf einem leeren Gerät (noch kein Velo, Teil, keine Tour) zeigt Heute weiter «Heute fällig», wenn etwas fällig ist (zum Beispiel ein Termin aus dem Spielerplus-Kalender, ein To-do oder Velopflege). Vorher steckte die Karte im Körper-Block, der auf dem leeren Gerät nur mit Gesundheitsdaten kam: wer nur einen Kalender verbunden hatte, sah den Termin von heute nicht.
- Mit verbundenem Fitbit steht der Körper-Block auch auf dem leeren Gerät, damit seine Zeile sagt, warum es keinen Wert gibt («Google verweigert gerade die Werte»); vorher fehlte sie dort (Noah 21.10.2026: «Verbinde Fitbit», obwohl verbunden).
- Test `tests/e2e/heute-einzeln.spec.js` «weather at home, surprise round»: wartet, bis die Meldung «Rückgängig» weg ist; die Meldung hält ihre Zeit an, solange die Maus auf ihr liegt (Aktionen 1, Noah «1-5a»). Der Test nimmt die Maus jetzt vorher weg. Dasselbe in `tests/e2e/touren-aufraeumen.spec.js` (Doppelte Touren: «Rückgängig» deckt «Schliessen» ab).
- `tests/e2e/review044.spec.js`: die leere Heute-Seite heisst jetzt «Starte hier» (vorher «Erste Schritte»).

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Nicht in diesem PR: `fast-geschafft.spec` «no line when no star is close» (nach dem ersten Abhaken steht «Nur noch 1× bis Stern 1 · Wochen in Folge»); das kommt aus den Meilensteinen, nicht aus Heute.
- «Heute fällig» steht im leeren Zustand direkt unter der Wand mit «Jetzt dran», nur wenn der Körper-Block nicht da ist (sonst steckt sie wie bisher darin).
- Fertig-Regel: kein neues Feature; Seite und Absprung unverändert; app-stand unverändert.

## Wie das zu Klarheit und Auffindbarkeit beiträgt
- Was heute zählt (ein Termin), ist auch ohne andere Daten sofort auf Heute zu finden.

## Entscheide (für decisions.md)
- Keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ein leeres Gerät mit nur einem Spielerplus-Kalender (oder einem To-do für heute): Heute zeigt «Heute fällig».
2. Mit Körperdaten: «Heute fällig» steht wie bisher im Körper-Block.
