# Vorlagen mit Feldern

PR #<Nummer> · 27.10.2026 · Auftrag: Noah «1a 2a 3b 4a 5a» und 19:18 «ca. 20 Vorlagen, von denen ich im Frontend auswählen kann» (Thread «Klären Sprachnotiz in Rückblick und Notizvorlagen»)

## Was ist neu
- 22 Notizvorlagen mit echten Feldern: kurzer oder langer Text, Zahl mit Einheit, Skala 1 bis 5, Auswahl, Checkliste, Datum.
- Die 6 aus dem Vorschlag: Tourenbericht, Material-Learnings, Rennnotiz, Velo-Zustand, Tagesnotiz, Idee. Dazu allgemeine: To-do, Vision, Herausforderung, Strategie, Ziel, Entscheidung, Erkenntnis, Training, Wochenrückblick, Cooler Ort, Schlafplatz, Tourenidee, Panne und Reparatur, Dankbarkeit, Empfehlung, Treffen.
- Notizen › «Vorlagen auswählen»: alle 22 in 5 Gruppen; «Verwenden» wählt eine aus. Am Anfang gewählt: die 6 aus dem Vorschlag und To-do.
- Ausfüllen: Nichts ist Pflicht. «Übernehmen» schreibt die Notiz (Name als Titel, nur ausgefüllte Felder). Die Notiz behält die Werte zusätzlich (`note.form`), damit man sie später auswerten kann.
- Leiste «Hinzufügen» › Vorlage (Tagebuch, Tagescheck, Nach der Tour, Fahrt, Reise-Spur, Velopflege, Material, Träume, Eingang): die gewählten Vorlagen, die zur Seite passen; ausgefüllt kommt der Text unter deinen.
- Alles änderbar: umbenennen, Felder umbenennen, Art wählen, hinzufügen, löschen, sortieren (Pfeile und Ziehen), Vorlage löschen (mit Rückgängig), eigene Vorlage, «Zurück zum Standard».

## Was fällt weg oder rutscht tiefer
- Die einfache Textvorlage «Ideen» in Notizen fällt weg (Antwort 5a): Sie wird zur Vorlage «Idee» mit Feldern (Was, Warum, Für welche Tour oder welches Ziel, Nächster Schritt). Wer die Textvorlagen schon geändert hat, behält seine Liste.

## Selbst entschieden
- Zum Start gewählt: die 6 vorgeschlagenen und To-do; die anderen 15 warten in «Vorlagen auswählen».
- Ändert man eine Standard-Vorlage, wird die ganze Liste zur eigenen: Namen, Felder und Auswahlwörter stehen dann in der eigenen Sprache und bleiben so (wie bei den Textvorlagen).
- Checklisten-Felder werden zur Checkliste der Notiz (wie «- [ ]» im Notizfeld).
- Eine Notiz aus einer Vorlage ist danach normaler Text; die Felder später nochmals als Formular öffnen kommt nicht in diesem PR.
- Die Werte aus der Leiste «Hinzufügen» landen nur als Text auf der Seite (die Seiten haben kein Feld für Werte).
- Kein neuer Dexie-Speicher: Auswahl und eigene Vorlagen in `settings` «noteForms».

## Entscheide (für decisions.md)
- 27.10.2026: Vorlagen mit echten Feldern (3b), am passenden Ort und in Notizen (4a), die 6 vorgeschlagenen (5a) plus rund 20 allgemeine zur Auswahl (Noah 19:18).

## Stand im Plan (roadmap.md / vorhaben.md)
- Eingaben überall, Folgeidee 2 «Vorlagen für Notizen»: gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Notizen: Unter der Notiz «Vorlagen auswählen» tippen, bei «Vision» «Verwenden». «Vision» erscheint bei der Notiz.
2. «Tourenbericht» tippen, ein paar Felder ausfüllen, «Übernehmen» und «Speichern»: Die Notiz beginnt mit «Tourenbericht» und zeigt, was du ausgefüllt hast.
3. Tagebuch › neuer Eintrag › «Hinzufügen» › Vorlage: «Tagesnotiz» ist da; ausgefüllt steht sie unter deinem Text.
