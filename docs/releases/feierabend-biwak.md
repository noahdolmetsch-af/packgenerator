# Feierabend-Biwak

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N6

## Was ist neu
- Touren › Träume, unter «Passt jetzt: Ideen»: «Feierabend-Biwak» (`src/lib/dreams/BiwakCard.svelte`). Nennt den nächsten Abend («Fr 31. Okt. 17:30 los · Sa 9:00 zurück») und das Wetter der Nacht.
- Bis zu drei Schlafplätze nahe beim Wohnort: deine eigenen Punkte der Art «Schlafplatz» (auch die nach einer Tour bewerteten), die besten zuerst, dann die nächsten, mit km und Fahrzeit (`src/lib/dreams/biwak.js`).
- «Einplanen» öffnet das bekannte Formular «Tour planen»: zwei Tage, Nacht «Biwak», der Baustein Biwak bringt die Packliste; die Notiz hält Zeiten und Ort fest.
- «Abend, Zeiten, Distanz ändern»: Wochentag, Los- und Zurück-Zeit, Schlafplätze bis 15, 30 oder 50 km. Zurück zum Vorschlag mit Rückgängig.
- Einstellung `dreams.biwak` (im Backup). Neue Funktion im Katalog: `f.biwak`.

## Was fällt weg oder rutscht tiefer
- Träume: «Alle Träume auf einer Karte», «Erfüllte Träume», «Weisse Flecken» und die Teile darunter rücken um das Biwak nach unten.

## Selbst entschieden
- Schlafplätze sind nur deine eigenen (kein Laden aus dem Netz): so zeigt das Biwak nur Orte, die du kennst oder selbst gesetzt hast.
- Fahrzeit mit 18 km/h und Umweg-Faktor 1,3 auf die Luftlinie.
- Ohne Schlafplatz in Reichweite gibt es «Ohne Schlafplatz einplanen» und einen Hinweis, wie man einen setzt.

- Fehler mitrepariert: «Rennen als Tour planen» auf Träume speicherte nicht (die Tour verlor ihre Kennung). Jetzt klappt es wieder.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 14 von 20 (N6). Als Nächstes N7 «Zug hin, Velo heim».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume: «Feierabend-Biwak» nennt den nächsten Freitag 17:30.
2. Bei einem Schlafplatz «Einplanen» und «Tour erstellen»: Packen öffnet sich mit der Biwak-Liste.
3. «Abend, Zeiten, Distanz ändern» → Samstag: das Datum wandert mit.
