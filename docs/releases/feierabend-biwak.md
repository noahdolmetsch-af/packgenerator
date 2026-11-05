# Feierabend-Biwak

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N6

## Was ist neu
- Touren › Träume, unter «Passt jetzt: Ideen»: «Feierabend-Biwak» (`src/lib/dreams/BiwakCard.svelte`). Nennt den nächsten Abend («Fr 31. Okt. 17:30 los · Sa 9:00 zurück») und das Wetter der Nacht.
- Bis zu drei Schlafplätze nahe beim Wohnort: deine eigenen Punkte der Art «Schlafplatz» (auch die nach einer Tour bewerteten), die besten zuerst, dann die nächsten, mit km und Fahrzeit (`src/lib/dreams/biwak.js`).
- «Einplanen» öffnet das bekannte Formular «Tour planen»: zwei Tage, Nacht «Biwak», der Baustein Biwak bringt die Packliste; die Notiz hält Zeiten und Ort fest.
- «Abend, Zeiten, Distanz ändern»: Wochentag, Los- und Zurück-Zeit, Schlafplätze bis 15, 30 oder 50 km. Zurück zum Vorschlag mit Rückgängig.
- «Freie Plätze in der Nähe suchen (OpenStreetMap)»: auf Tipp Zeltplätze, Picknick- und Waldhütten und Biwakschachteln im gewählten Umkreis, die nächsten zuerst, je mit «Einplanen» (Noah 28.10.2026 «2b»). Gefragt wird nur beim Tippen, nichts wird gespeichert.
- Einstellung `dreams.biwak` (im Backup). Neue Funktion im Katalog: `f.biwak`.

## Was fällt weg oder rutscht tiefer
- Träume: «Alle Träume auf einer Karte», «Erfüllte Träume», «Weisse Flecken» und die Teile darunter rücken um das Biwak nach unten.

## Selbst entschieden
- Zuerst stehen deine eigenen Schlafplätze; die freien aus OpenStreetMap kommen nur auf Tipp dazu (gleiche Arten wie in der Ortssuche der Karte: Camping, Picknick- und Waldhütte, Biwakschachtel; private ausgelassen).
- Unter der Liste der Hinweis «Prüfe vor Ort, ob du dort übernachten darfst».
- Fahrzeit mit 18 km/h und Umweg-Faktor 1,3 auf die Luftlinie.
- Ohne Schlafplatz in Reichweite gibt es «Ohne Schlafplatz einplanen» und einen Hinweis, wie man einen setzt.

- Fehler mitrepariert: «Rennen als Tour planen» auf Träume speicherte nicht (die Tour verlor ihre Kennung). Jetzt klappt es wieder.

## Entscheide (für decisions.md)
- Noah 28.10.2026 «2b»: das Biwak zeigt auf Tipp auch freie Plätze aus OpenStreetMap.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 14 von 20 (N6). Als Nächstes N7 «Zug hin, Velo heim».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume: «Feierabend-Biwak» nennt den nächsten Freitag 17:30.
2. Bei einem Schlafplatz «Einplanen» und «Tour erstellen»: Packen öffnet sich mit der Biwak-Liste.
3. «Freie Plätze in der Nähe suchen» tippen: Zeltplätze und Hütten in der Nähe erscheinen, die nächsten zuerst.
4. «Abend, Zeiten, Distanz ändern» → Samstag: das Datum wandert mit.
