# «Weitere Orte» deckt keinen Ort zu

PR #1783 · 17.11.2026 · Auftrag: Noah «alle umsetzen 1-10» (Thread «UI-Test der Seite Flow Training», Fund 10)

## Was ist neu
- Am Computer mit niedrigem Fenster (900 px und weniger) schwebte der Knopf «Weitere Orte» über dem letzten Ort der Seitenleiste («Quick Links») und verdeckte ihn. Jetzt steht er in einer eigenen Zeile unter der Liste. Ein Tipp scrollt die Liste weiter wie bisher.

## Was fällt weg oder rutscht tiefer
- Die Liste der Orte ist am niedrigen Fenster eine Zeile kürzer (etwa 30 px), weil der Knopf eigenen Platz bekommt. Wer mehr sehen will, scrollt wie vorher.

## Selbst entschieden
- Gilt für alle Seiten (die Seitenleiste ist überall dieselbe). Der weiche Rand am Ende der Liste bleibt.
- Die Zeilen der Orte selbst wurden nicht enger gemacht: 44 px sind die Mindest-Tippfläche.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Computer das Fenster auf etwa 780 px Höhe ziehen, Seite «Aktiv» öffnen.
2. «Weitere Orte» steht in einer eigenen Zeile unter der Liste, deckt «Quick Links» nicht zu.
