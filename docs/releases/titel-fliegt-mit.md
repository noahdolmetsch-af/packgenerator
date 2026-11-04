# Der Name fliegt mit

PR folgt · 03.11.2026 · Auftrag: Noah «b» (Thread «Durchgehen: offene Fragen einzeln», Paket A Seitenwechsel, Idee 2 von 5)

Ziel 5 «Alltag» (Entscheid 26.10.2026 «Bewegung überall sanft»), Idee aus `notes/ideen-bewegung-2026-11-03`.

## Was ist neu
- Tippt man in Touren in der Liste «Mit Packliste» auf den Namen einer Tour, wandert der Name in etwa 0,26 s an seinen Platz in der Überschrift der Tour-Seite. Das Auge kann ihm folgen. Der Rest der Seite erscheint sofort wie bisher.
- Technik: eine View Transition des Browsers, an der nur der Name teilnimmt (`src/lib/nav/vtitle.js`, CSS in `app.css`, Marke `data-vt-title` auf dem Namen in `Trips.svelte`). Der Router (`App.svelte`) bleibt unberührt.
- Aus bei «Bewegung reduzieren» am Gerät, bei Ich › Darstellung › Bewegung «Aus» und in Browsern ohne View Transitions: dann geht die Seite auf wie bisher.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur der Tour-Name in der Touren-Liste ist die Quelle. Die Velo-Zeichnung (Velo-Karte → Velo-Seite) ist nicht dabei: ein Velo öffnet sich auf derselben Seite (Reiter «Pflege»), nicht auf einer eigenen; das braucht eine andere Lösung und kommt als eigener kleiner PR, wenn Noah es will.
- Der Browser hält das Adresswechsel-Ereignis einen Frame zurück, damit er das Bild der Liste aufnehmen kann, und gibt es dann an die App weiter. Wartet die Tour-Seite beim ersten Besuch auf ihren Code, zeigt der Bildschirm bis höchstens 0,7 s das alte Bild.
- Nur ein Tipp auf den markierten Namen (ohne Strg/Shift/Cmd, linke Taste) und nur der Wechsel direkt danach (höchstens 1,5 s) startet den Flug. Zurück-Taste, Suche und alle anderen Wege bleiben wie sie sind.
- Der Name wird nur während des Fluges benannt, nie dauerhaft (ein benanntes Element würde sonst Stapel und Lage ändern).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket A Seitenwechsel, Idee 2: gebaut für Touren. Folgt: 5 grosser Titel wird klein.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen (am Handy zuerst «Mit Packliste»), auf den Namen einer Tour tippen: der Name wandert zur Überschrift der Tour-Seite.
2. Mit «Bewegung reduzieren» am Gerät: die Seite geht ohne Flug auf.
