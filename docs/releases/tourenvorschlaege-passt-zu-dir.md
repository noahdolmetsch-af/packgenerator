# Tourenvorschläge: Passt zu dir

PR (Nummer nach dem Öffnen) · 23.11.2026 · Auftrag: Noah «alles umsetzen» (Thread «100 kluge MTB-Touren vorschlagen»). Schritt 3 von 6.

## Was ist neu
- **Gruppe «Für dich»** bei den Filtern: eine Zeile sagt, wie deine Form heute ist (die Antwort von «Form und Erholung»), wie lange du heute frei bist (ab jetzt bis Sonnenuntergang oder bis zum nächsten Termin in Google-Kalender und Mein Tag) und ob du ein Mountainbike hast.
- **Filter «Heute machbar»:** nur Touren, bei denen Fahrt in deinem Tempo plus Anreise ins freie Fenster passen und die Form nicht «Ruhe» sagt. Er ist am Anfang aus.
- **Karte einer Tour:** «Heute machbar» oder «Heute nicht machbar», sobald die App Form oder freie Zeit kennt.
- **«Warum dieser Vorschlag?»:** neue Zeilen «Freie Zeit», «Form heute» und «Velo», jede abschaltbar.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur lesen: die Seite ändert keine Daten von Kalender, Mein Tag, Form oder Velos.
- Das freie Fenster beginnt 30 Minuten nach jetzt, frühestens um 7 Uhr, und endet beim Sonnenuntergang (Wetterdaten des Wohnorts), sonst um 17 Uhr; Termine begrenzen es.
- «Leicht» in der Form warnt bei Touren über 3 Stunden oder 1200 m Aufstieg, «normal» ab 7 Stunden. Es ist immer nur ein Hinweis.
- Ohne Wohnort gibt es keine Wetterdaten und damit kein freies Fenster: die Zeile sagt es, der Filter lässt dann alles stehen.
- Fertig-Regel: Seite (Eintrag bleibt), Absprung unverändert, «Gut zu wissen» nicht nötig, leerer Zustand unverändert, App-Stand angepasst.

## Entscheide (eigene Datei `docs/decisions/tourenvorschlaege-passt-zu-dir.md`)
- 23.11.2026: «Heute machbar» ist aus am Anfang; die Form kommt aus der einen Tagesantwort.

## Stand im Plan (roadmap.md / vorhaben.md)
- Tourenvorschläge: Schritt 3 von 6. Offen: Wetter, Lernen und Neuland, Untergrund und «Als Tour planen».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Tourenvorschläge: unter den Filtern steht die Gruppe «Für dich» mit einer Zeile zu heute.
2. «Heute machbar» antippen: Touren, die nicht passen, verschwinden.
3. Eine Tour öffnen: «Warum dieser Vorschlag?» hat Zeilen zu freier Zeit, Form und Velo.
