# Gruss «Wi gahts?» A: mehr Knöpfe, sofort speichern, gestern markiert

PR · 05.11.2026 · Auftrag: Noah «alle umsetzen» (Thread «Planen: Tagescheck mit Fragen»), Vorschlag [gruss-wi-gahts-vorschlag.md], Prüfliste [gruss-pruefliste.md] (Projektordner `tagescheck/`). Erster von vier PRs (A Knöpfe, B Anpassen, C Wetter + Wochenstreifen, D «Woran liegt's?» + Abend).

## Was ist neu
- Der Tipp auf den Gruss öffnet das Fenster wie bisher (fünf Gesichter, Plan). Neu: «Mehr» unter den Gesichtern öffnet 17 weitere Knöpfe in zwei Gruppen: Energie (Wach, Glade, Schläfrig, Platt, Überdreht) und Gefühle (Ruhig, Glücklich, Dankbar, Stolz, Gwundrig, Motiviert, Verliebt, Gstresst, Gnervt, Truurig, Ängstlich, Eisam). Ein Gesicht plus beliebig viele Gefühle.
- Jeder Tipp wird sofort gespeichert (nach 0,3 Sekunden), ohne «Speichern». Ein zweiter Tipp nimmt die Antwort zurück, die Zeile verschwindet. «Fertig» schliesst nur.
- Die Antwort von gestern ist ruhig markiert: gestrichelter Rahmen, beim Gesicht dazu «gestern».
- Die Gefühle sind eine neue Frage im Verlauf (`hallo.gefuehl`, wie `hallo.gaht` und `hallo.vor` nie von selbst gefragt); der Verlauf zeigt sie wie jede Antwort.
- Die Stimmung (Gesicht) geht wie bisher in den Balance-Ring (Spass). Die Gefühle zählen im Ring nicht (reine Beobachtung).

## Was fällt weg oder rutscht tiefer
- Der Knopf «Speichern» und «Nicht jetzt» im Fenster sind weg; ersetzt durch «Fertig». Wer nichts tippt, speichert nichts (wie bisher mit «Nicht jetzt»).
- Die Zeile «Zwei kurze Fragen, beide freiwillig» heisst jetzt «Alles freiwillig, gespeichert beim Tippen».

## Selbst entschieden
- Die zusätzlichen Knöpfe stehen hinter «Mehr» (Noahs 1a), damit die fünf Gesichter mit einem Tipp erreichbar bleiben. Ist «Mehr» zu und es sind Gefühle gewählt, zeigt der Knopf die Anzahl.
- Gefühle haben bewusst keinen Zahlenwert und zählen nicht im Ring: sie sind keine Wertung.
- Die Namen der Knöpfe sind Mundart-Konstanten wie die Gesichter (HG1 1a); die Gruppennamen gehen durch `t()`.
- Anpassen (hinzufügen, umbenennen, löschen) kommt im nächsten PR (B); die Knöpfe sind dafür schon als Liste mit Schlüssel angelegt.
- Kein Eintrag in `features.js`: keine neue Funktion, die Zeile «Heute» in `app-stand.md` nennt den Gruss.

## Entscheide (für decisions.md)
- 05.11.2026: Gruss «Wi gahts?» wird ausgebaut (Noah «alle umsetzen»): mehr Knöpfe, sofort speichern, gestern markiert, später anpassbar, Wetter und Wochenstreifen, «Woran liegt's?», Abend-Variante.

## Stand im Plan (roadmap.md / vorhaben.md)
- Gruss-Ausbau: Schritt A von D.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute, oben auf den Gruss tippen: fünf Gesichter, darunter «Mehr».
2. «Mehr» antippen, «Ruhig» und «Dankbar» wählen: beide bleiben markiert. «Fertig».
3. Ich › Daten › Verlauf: «Wi gaht's?» zeigt Gesicht und Gefühle.
4. Am nächsten Tag: das Gesicht von gestern hat einen gestrichelten Rahmen und «gestern».
