# Erste Nacht: drei Fragen danach und Übernahme in die Packliste

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «7a» (Thread «Bauen: Freie Zeit Teil 2»), Idee «Erste Nacht – nach der Nacht drei Fragen (Schlaf, Kälte, was fehlte) und Übernahme in die Packliste». Baut auf «Fürs nächste Mal: Notizen direkt auf die Packliste» auf (gleiche Übernahme-Funktion).

## Was ist neu
- Schritt 4 «Nach der Nacht» fragt drei Dinge: «Wie hast du geschlafen?» (Gut / Geht so / Schlecht), «Hat es dich gefroren?» (Nein / Ein bisschen / Ja, zu kalt, mit «Wo hast du es gespürt?») und «Was hat gefehlt?» (ein Ding pro Zeile). Alles wird beim Tippen gespeichert.
- Darunter «Auf die Packliste»: Tour wählen (vorgewählt: die nächste) und «Auf die Packliste setzen». Fehlendes wird zu Dingen auf der Liste (nicht gepackt; ein gleichnamiges Ding aus deiner Ausrüstung wird genommen, sonst entsteht ein neues). Kälte und schlechter Schlaf werden zu Planungs-Notizen der Tour.
- Die Meldung sagt, was passiert ist, mit «Rückgängig». Danach steht «Übernommen auf «Tour»» und «Zur Packliste» da.
- Ohne passende Tour sagt die Seite das und führt zu den Touren.

## Was fällt weg oder rutscht tiefer
- nichts (das freie Feld «Was ich herausgefunden habe» bleibt oben)

## Selbst entschieden
- Planungs-Notizen statt automatischer Dinge bei Kälte und Schlaf: ob es ein wärmerer Schlafsack oder eine Matte wird, entscheidet Noah selbst.
- Die erste Nacht selbst wird nicht als Vorschlag für die Packliste angeboten (Tourwahl ohne die Tour der Nacht).
- Fehler behoben: Die Tourwahl in Schritt 2 zeigte leere Namen (las `name` statt `title`).
- Ein Thread «Packen testen» war beim Bau nicht zu finden; der Abgleich beschränkt sich darauf, dass nur die vorhandene Übernahme (uebernahme.js) benutzt wird und Packen selbst nicht verändert wird.

## Entscheide (für decisions.md)
- 05.11.2026: Antworten der ersten Nacht («kalt», «schlecht geschlafen») werden Planungs-Notizen, keine Dinge.

## Stand im Plan (roadmap.md / vorhaben.md)
- Freie Zeit, Ergänzung «Erste Nacht»: gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Freie Zeit › Erste Nacht › Schritt 4: die drei Fragen beantworten.
2. Tour wählen, «Auf die Packliste setzen»: Meldung mit «Rückgängig».
3. «Zur Packliste»: Fehlendes steht drauf, die Notizen bei den Planungs-Notizen der Tour.
