# Zurück dahin, woher du kamst

PR #… · 07.11.2026 · Auftrag: Noah «alle Vorschläge» der UI-Prüfung, A2 (Rückweg), Antwort «4a» (Thread «Absprünge: Analyse und Aktiv antippbar machen»)

## Was ist neu
- Die Seite eines Werts in der Analyse (`#/auswerten/analyse/<Wert>`) zeigt oben links «‹ Zurück zu Heute» (oder Aktiv, Touren, Velos …), wenn du von dort kamst. Ein Tipp führt auf diese Seite zurück.
- Kamst du von Auswerten selbst, steht dort nichts Neues: der Weg dorthin ist schon der Pfad «Auswertung › Analyse».
- Neu im Code: `src/lib/nav/herkunft.js` (Regeln, getestet) und `herkunft.svelte.js` (merkt sich die verlassene Adresse für diese Sitzung), eine Zeile in `App.svelte`, ein Feld `back` in `Crumb.svelte`. Andere Seiten können es später mit einer Zeile nutzen.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Gemerkt wird nur beim Wechsel auf die Seite eines Werts von ausserhalb von Auswerten; innerhalb der Analyse bleibt der alte Ursprung.
- Der Ursprung gilt für diese Sitzung des Browsers (nicht in Backup, nicht auf anderen Geräten) und wird beim Schliessen des Tabs vergessen.
- Am Handy steht «‹ Zurück zu Heute · Analyse»: der Weg zur Analyse bleibt daneben, kurz gehalten.
- Keine neue Funktion in `features.js`: ein Weg auf einer bestehenden Seite.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: «Zurück zu Heute» (Noah «4a») gebaut für die Seite eines Werts; weitere Seiten folgen mit ihren eigenen PRs.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute oder Aktiv eine Zahl oder Kachel antippen, die in die Analyse führt: oben links steht «Zurück zu Heute» (oder Aktiv).
2. Darauf tippen: du bist wieder auf der Seite, von der du kamst.
3. In der Analyse zu einem anderen Wert wechseln: «Zurück zu …» bleibt dasselbe.
