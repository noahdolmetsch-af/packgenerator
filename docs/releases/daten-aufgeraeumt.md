# Daten und Backup aufgeräumt

PR (Ich › Daten und Backup, ein PR) · 01.11.2026 · Auftrag: Noah «Lass uns hier aufräumen …», Antworten «1a 2a 3a 4a 5b» und «alle Ideen umsetzen» (Thread «Aufräumen Ich > Daten und Anmeldung»). Noah wählte 5b: alles auf einmal, trotz der Regel «kleine PRs».

## Was ist neu
- Eine Statuszeile «Alles in Ordnung?» mit dem letzten Backup. Die sechs Ampeln liegen hinter «Einzelheiten». Ist ein Backup fällig, wird die Zeile orange und hat «Jetzt sichern» (`DataPanel.svelte`).
- Der Abgleich (Handy und Computer) steht gleich unter der Statuszeile.
- Frage «Brauchst du die App auf zwei Geräten?» (Ja / Nein), einmal pro Gerät (`localStorage` `pg.twoDevices`, nicht in den Daten). Ja zeigt den Abgleich, Nein klappt ihn zu («Auf zwei Geräten arbeiten», mit «Nochmals fragen»). Ist der Abgleich schon an, kommt die Frage nicht.
- «Mit einer Backup-Datei sichern» (zugeklappt): Backup speichern, an den Computer/Handy schicken, importieren. Es öffnet sich von selbst, wenn eine Datei wartet oder eine Meldung kommt.
- «Mehr» (zugeklappt): Passwort, Auto-Backup in einen Ordner, Kopien vor Updates, Andere Daten, englische Namen, Neu beginnen. Neu: `src/lib/ui/MoreFold.svelte` (ein echtes `<details>`).
- «Alles löschen» fragt zuerst nach einem Backup («Backup speichern» im Fragefenster). Es ist nie Pflicht.
- Ein Wort pro Ding: «Backup» für die Datei, «Abgleich» für den Sync. Deutsche Texte mit «Sicherung» heissen jetzt «Backup»; die Kopie vor einem Update heisst «Kopie».
- Die Sprungchips (Stimmt das noch?, Beispiele holen …) öffnen die Faltstellen darum herum (`QuickLinks.svelte`).

## Was fällt weg oder rutscht tiefer
- Weg: der Knopf «Mit Google anmelden» auf dieser Seite (Code, QR und «Ich habe einen Code» bleiben). Wer schon mit Google angemeldet ist, sieht sein Konto und «Abmelden» weiter. Der Google-Code bleibt im Programm (`SHOW_GOOGLE` in `SyncPanel.svelte`).
- Weg: die sechs Ampeln als Liste (hinter «Einzelheiten»), die zweite Erklärung der Datei-Schritte und der zweite «Backup öffnen»-Knopf (die Datei steht jetzt einmal).
- Tiefer: Backup-Datei, Passwort, Ordner-Backup, Kopien vor Updates, Andere Daten, Neu beginnen (alle unter zwei Faltstellen).
- Umgezogen: Gesundheitsdaten (Fitbit) von dieser Seite auf «Ich › Fitbit»; hier bleibt eine Zeile mit Link.

## Selbst entschieden
- Die Frage «zwei Geräte» steht auf dieser Seite, nicht als Fenster beim ersten Start.
- «Beispiele entfernen» verschwindet schon heute von selbst, sobald keine Beispiele mehr da sind (dann steht «Beispiele holen»). Nichts geändert.
- Das Fenster von «Alles löschen» bleibt ohne Backup bedienbar.
- Daten, Backup-Format und Abgleich-Code sind nicht angefasst.

## Entscheide (für decisions.md)
- 01.11.2026: Ich › Daten und Backup zeigt drei Dinge zuerst (Statuszeile, Abgleich, Rest zugeklappt); die Google-Anmeldung ist ausgeblendet; Fitbit nur auf seiner Seite.

## Stand im Plan (roadmap.md / vorhaben.md)
- Aufräumen Daten und Anmeldung: umgesetzt mit diesem PR. Offen: ob die Google-Anmeldung ganz entfernt wird.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup: oben die Statuszeile, dann der Abgleich (oder die Frage «zwei Geräte»).
2. «Einzelheiten» antippen: die sechs Punkte erscheinen.
3. «Mehr» und «Mit einer Backup-Datei sichern» öffnen: alles Seltene ist dort.
4. «Neu beginnen» antippen: im Fenster steht zuerst «Backup speichern».
