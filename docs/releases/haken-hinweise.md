# Was in deinen Haken auffällt

PR #1842 · 27.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Abhaken auf einen Blick verbessern», Schritt 3 von 3)

## Was ist neu
- Auswerten › Woche hat unter dem Haken-Verlauf die Karte «Was auffällt»: bis zu fünf Hinweise über alle Aktivitäten, jeder mit einem Satz «Warum». Fünf Arten: Tage in Folge Bewegung ohne Erholung («Heute erholen?»), eine Lücke gegen den eigenen üblichen Abstand, eine Serie, was du oft zusammen abhakst, ein Wochentag.
- Auf Heute steht direkt unter «Heute abhaken» eine einzige ruhige Zeile mit dem nützlichsten Hinweis (Erholung, Lücke oder Serie); ein Tipp öffnet die Karte.
- Alles ist Beobachtung: nichts wird bewertet, «Zusammen» sagt ausdrücklich «Muster, keine Ursache».

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeile auf Heute steht neu unter dem Block, ohne ihn zu verschieben; die Karte in Auswerten steht unter dem Haken-Verlauf, über dem Bericht der Woche (der rutscht noch ein Stück tiefer).

## Selbst entschieden
- Fertig-Regel: kein neuer Eintrag in `features.js` (Teil der Seite Auswerten › Woche), Absprung ist die Zeile auf Heute, leerer Zustand steht in der Karte («Gerade fällt nichts Besonderes auf …»), «Gut zu wissen» entfällt (der Satz «Warum» steht bei jedem Hinweis).
- Die Zeile auf Heute folgt dem bestehenden Schalter «Leistungstipps» (Ich › Aussehen › Vorschläge), statt einen neuen Schalter zu bauen; die Karte bleibt immer.
- Schwellen (3 Tage in Folge, 6 Tage Lücke und doppelter eigener Abstand, 5 gemeinsame Tage und 1,8-fach, 45 % Wochentag) in `src/lib/flow/hakenhinweise.js` oben als Konstanten; leicht zu ändern.
- Eine Lücke von mehr als 28 Tagen gilt als beendet, nicht als Pause, und wird nicht gemeldet.
- Kein «Nicht heute»-Knopf: es gibt nur eine Zeile, und der Schalter schaltet sie ganz aus.

## Entscheide (eigene Datei `docs/decisions/haken-hinweise.md`)
- 27.11.2026: Hinweise als Karte in Auswerten und eine Zeile auf Heute (4a), fünf Arten, nur Beobachtung.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung (Schritt 3 von 3; Ideen für später stehen in der Entscheid-Datei).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Woche öffnen: unter dem Haken-Verlauf steht «Was auffällt» mit Hinweisen und «Warum: …» oder dem Satz «Gerade fällt nichts Besonderes auf».
2. Heute öffnen: unter «Heute abhaken» steht höchstens eine Zeile; tippen öffnet die Karte.
3. Ich › Aussehen › Vorschläge › Leistungstipps ausschalten: die Zeile auf Heute ist weg, die Karte bleibt.
