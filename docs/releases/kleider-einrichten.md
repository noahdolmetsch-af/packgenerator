# Kleiderschrank einrichten

PR #1783 · 21.11.2026 · Auftrag: Noah «1-5a 4b» (Thread «Kleiderschrank wieder ins Zentrum rücken», Weg C)

## Was ist neu
- Neue Seite `#/wardrobe/setup` «Kleiderschrank einrichten»: ein Kleidungsstück nach dem anderen, in einem Tipp die Temperatur (fünf Stufen Warm, Mild, Kühl, Kalt, Frost; eine oder zwei nebeneinander), dazu Schicht und Körperstelle. Der Vorschlag aus dem Namen (oder der Klasse des Imports) ist schon gewählt, «Speichern und weiter» ist ein Tipp.
- «Überspringen» lässt das Teil, wie es ist; «Hab ich nicht mehr» setzt es auf «Weg»; jede Speicherung hat «Rückgängig».
- Die Reihenfolge: zuerst die Teile, die am häufigsten auf Touren waren.
- Im Kleiderschrank steht oben «N Teile noch ohne Temperatur oder Platz» mit dem Knopf «Kleiderschrank einrichten».
- Am Ende: «Kleiderschrank eingerichtet» mit «Zum Kleiderschrank» und Hinweis auf Heute.

## Was fällt weg oder rutscht tiefer
- nichts. Das Einordnen im Kleiderschrank («Noch einordnen») bleibt, wie es ist.

## Selbst entschieden
- Eine eigene Seite statt eines Fensters (Unterseite von `#/wardrobe`, kein neuer Menüpunkt), damit der Kleiderschrank selbst unverändert bleibt.
- Die Stufen speichern `tempMin`/`tempMax` wie bisher (Warm = ab 20 °C, offen nach oben; Frost = −15 bis 0 °C). Kein neues Feld, kein Schema, Backup-Format unverändert.
- Alltagskleider (nur Alltag) kommen nicht in die Reihe, weil Heute und die Zwiebel sie nie zählen.
- Absprünge von Heute und aus der Packliste fehlen noch: sie kommen mit Weg B (Packliste in Zwiebel-Form) und Weg A (Anprobe), die diese Orte ohnehin anfassen.
- Das Foto und die Frage «zu kalt / passte / zu warm» sind eigene Schritte (PR 4).

## Entscheide (für decisions.md)
- 21.11.2026: Kleider soll wieder zentral werden, Reihenfolge C → B → A (Noah «1-5a»); die App legt die Zwiebel in der Packliste selbst ein, Noah korrigiert (Noah «4b», Weg B).

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben «Kleiderschrank wieder ins Zentrum»: Schritt C gebaut; B und A folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material › Kleider öffnen: oben steht «N Teile noch ohne Temperatur oder Platz».
2. «Kleiderschrank einrichten» tippen, bei einem Teil «Speichern und weiter», dann «Rückgängig».
3. Heute öffnen: «Was ziehe ich heute an?» zeigt weniger «nichts warm genug».
